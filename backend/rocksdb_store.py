"""
RocksDB Key-Value Store Implementation
Provides a persistent KV store with HTTP-accessible stats and dashboard.
"""

import json
import time
from pathlib import Path
from typing import Any, Dict, Optional, List
from rocksdict import Rdict, Options, AccessType


class RocksDBStore:
    """Wrapper for RocksDB operations with stats tracking."""
    
    def __init__(self, db_path: str):
        """Initialize RocksDB instance.
        
        Args:
            db_path: Path to the RocksDB database directory
        """
        self.db_path = Path(db_path)
        self.db_path.mkdir(parents=True, exist_ok=True)
        
        # Configure RocksDB options for better performance
        options = Options()
        options.create_if_missing(True)
        options.set_max_open_files(10000)
        options.set_write_buffer_size(67108864)  # 64MB
        options.set_max_write_buffer_number(3)
        options.set_target_file_size_base(67108864)  # 64MB
        
        # Open database
        self.db = Rdict(str(self.db_path), options=options)
        
        # Stats tracking
        self.stats = {
            'operations': {
                'get': 0,
                'put': 0,
                'delete': 0,
                'cas_put': 0,
            },
            'cache_hits': 0,
            'cache_misses': 0,
            'start_time': time.time(),
        }
    
    def get(self, key: str) -> Optional[Any]:
        """Retrieve value from RocksDB.
        
        Args:
            key: Key to retrieve
            
        Returns:
            Deserialized value or None if key doesn't exist
        """
        self.stats['operations']['get'] += 1
        
        try:
            value_bytes = self.db.get(key.encode('utf-8'))
            if value_bytes is None:
                self.stats['cache_misses'] += 1
                return None
            
            self.stats['cache_hits'] += 1
            # Deserialize JSON value
            return json.loads(value_bytes.decode('utf-8'))
        except Exception as e:
            print(f"Error getting key {key}: {e}")
            self.stats['cache_misses'] += 1
            return None
    
    def put(self, key: str, value: Any) -> None:
        """Store value in RocksDB.
        
        Args:
            key: Key to store
            value: Value to store (will be JSON serialized)
        """
        self.stats['operations']['put'] += 1
        
        # Serialize value as JSON
        value_json = json.dumps(value)
        self.db[key.encode('utf-8')] = value_json.encode('utf-8')
    
    def cas_put(self, key: str, value: Any, if_absent: bool = True) -> bool:
        """Conditional store - only store if key doesn't exist (if_absent=True).
        
        Args:
            key: Key to store
            value: Value to store
            if_absent: If True, only store if key doesn't exist
            
        Returns:
            True if value was stored, False otherwise
        """
        self.stats['operations']['cas_put'] += 1
        
        if if_absent:
            existing = self.get(key)
            if existing is not None:
                return False
        
        self.put(key, value)
        return True
    
    def delete(self, key: str) -> None:
        """Delete key from RocksDB.
        
        Args:
            key: Key to delete
        """
        self.stats['operations']['delete'] += 1
        
        try:
            del self.db[key.encode('utf-8')]
        except KeyError:
            pass  # Key doesn't exist, that's fine
    
    def keys(self, prefix: Optional[str] = None) -> List[str]:
        """List all keys, optionally filtered by prefix.
        
        Args:
            prefix: Optional prefix to filter keys
            
        Returns:
            List of keys (as strings)
        """
        keys = []
        
        if prefix:
            prefix_bytes = prefix.encode('utf-8')
            for key in self.db.keys():
                if key.startswith(prefix_bytes):
                    keys.append(key.decode('utf-8'))
        else:
            keys = [key.decode('utf-8') for key in self.db.keys()]
        
        return keys
    
    def count(self, prefix: Optional[str] = None) -> int:
        """Count keys, optionally filtered by prefix.
        
        Args:
            prefix: Optional prefix to filter keys
            
        Returns:
            Number of keys
        """
        return len(self.keys(prefix))
    
    def get_stats(self) -> Dict[str, Any]:
        """Get RocksDB statistics.
        
        Returns:
            Dictionary with database statistics
        """
        uptime = time.time() - self.stats['start_time']
        total_ops = sum(self.stats['operations'].values())
        
        # Calculate cache hit rate
        total_reads = self.stats['cache_hits'] + self.stats['cache_misses']
        cache_hit_rate = (self.stats['cache_hits'] / total_reads * 100) if total_reads > 0 else 0.0
        
        return {
            'database_path': str(self.db_path),
            'total_keys': self.count(),
            'uptime_seconds': round(uptime, 2),
            'operations': self.stats['operations'].copy(),
            'total_operations': total_ops,
            'cache_stats': {
                'hits': self.stats['cache_hits'],
                'misses': self.stats['cache_misses'],
                'hit_rate_percent': round(cache_hit_rate, 2),
            },
            'ops_per_second': round(total_ops / uptime, 2) if uptime > 0 else 0.0,
        }
    
    def get_rocksdb_property(self, property_name: str) -> Optional[str]:
        """Get internal RocksDB property.
        
        Args:
            property_name: RocksDB property name (e.g., 'rocksdb.stats')
            
        Returns:
            Property value or None if not available
        """
        try:
            # Try to get property if supported by rocksdict
            # Note: rocksdict may not expose all RocksDB properties
            return None  # Placeholder - rocksdict doesn't expose property interface
        except Exception:
            return None
    
    def close(self) -> None:
        """Close the RocksDB database."""
        if hasattr(self, 'db') and hasattr(self.db, 'close'):
            try:
                self.db.close()
            except Exception:
                pass  # Already closed
    
    def __del__(self):
        """Cleanup on deletion."""
        # Note: __del__ is not guaranteed to be called
        pass
