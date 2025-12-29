"""
Database models for repository configuration.
Stores schema.json configuration in SQLite for dynamic management.
"""

import sqlite3
import json
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, List, Optional

DB_PATH = Path(__file__).parent / "config.db"


def get_db():
    """Get database connection."""
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn


def init_config_db():
    """Initialize the configuration database schema."""
    conn = get_db()
    cursor = conn.cursor()
    
    # Repository metadata
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS repository_config (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            schema_version TEXT NOT NULL,
            type_id TEXT NOT NULL,
            description TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
    """)
    
    # Capabilities
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS capabilities (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            config_id INTEGER NOT NULL,
            protocols TEXT NOT NULL,
            storage TEXT NOT NULL,
            features TEXT NOT NULL,
            FOREIGN KEY (config_id) REFERENCES repository_config(id) ON DELETE CASCADE
        )
    """)
    
    # Entity definitions
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS entities (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            config_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            type TEXT NOT NULL,
            primary_key TEXT,
            created_at TEXT NOT NULL,
            FOREIGN KEY (config_id) REFERENCES repository_config(id) ON DELETE CASCADE
        )
    """)
    
    # Entity fields
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS entity_fields (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            entity_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            type TEXT NOT NULL,
            optional INTEGER DEFAULT 0,
            normalizations TEXT,
            FOREIGN KEY (entity_id) REFERENCES entities(id) ON DELETE CASCADE
        )
    """)
    
    # Entity constraints
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS entity_constraints (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            entity_id INTEGER NOT NULL,
            field TEXT NOT NULL,
            regex TEXT NOT NULL,
            when_present INTEGER DEFAULT 0,
            FOREIGN KEY (entity_id) REFERENCES entities(id) ON DELETE CASCADE
        )
    """)
    
    # Storage configurations
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS blob_stores (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            config_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            kind TEXT NOT NULL,
            root TEXT NOT NULL,
            addressing_mode TEXT,
            addressing_digest TEXT,
            path_template TEXT,
            max_blob_bytes INTEGER,
            min_blob_bytes INTEGER,
            FOREIGN KEY (config_id) REFERENCES repository_config(id) ON DELETE CASCADE
        )
    """)
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS kv_stores (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            config_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            kind TEXT NOT NULL,
            root TEXT NOT NULL,
            FOREIGN KEY (config_id) REFERENCES repository_config(id) ON DELETE CASCADE
        )
    """)
    
    # API Routes
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS api_routes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            config_id INTEGER NOT NULL,
            route_id TEXT NOT NULL,
            method TEXT NOT NULL,
            path TEXT NOT NULL,
            tags TEXT,
            pipeline TEXT NOT NULL,
            created_at TEXT NOT NULL,
            FOREIGN KEY (config_id) REFERENCES repository_config(id) ON DELETE CASCADE
        )
    """)
    
    # Auth scopes
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS auth_scopes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            config_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            actions TEXT NOT NULL,
            FOREIGN KEY (config_id) REFERENCES repository_config(id) ON DELETE CASCADE
        )
    """)
    
    # Auth policies
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS auth_policies (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            config_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            effect TEXT NOT NULL,
            conditions TEXT,
            requirements TEXT,
            FOREIGN KEY (config_id) REFERENCES repository_config(id) ON DELETE CASCADE
        )
    """)
    
    # Caching configuration
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS caching_config (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            config_id INTEGER NOT NULL,
            response_cache_enabled INTEGER DEFAULT 1,
            response_cache_ttl INTEGER DEFAULT 300,
            blob_cache_enabled INTEGER DEFAULT 1,
            blob_cache_max_bytes INTEGER,
            FOREIGN KEY (config_id) REFERENCES repository_config(id) ON DELETE CASCADE
        )
    """)
    
    # Features configuration
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS features_config (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            config_id INTEGER NOT NULL,
            mutable_tags INTEGER DEFAULT 1,
            allow_overwrite_artifacts INTEGER DEFAULT 0,
            proxy_enabled INTEGER DEFAULT 1,
            gc_enabled INTEGER DEFAULT 1,
            FOREIGN KEY (config_id) REFERENCES repository_config(id) ON DELETE CASCADE
        )
    """)
    
    conn.commit()
    conn.close()


def load_schema_to_db(schema_path: Path):
    """Load schema.json into the database."""
    with open(schema_path) as f:
        schema = json.load(f)
    
    conn = get_db()
    cursor = conn.cursor()
    
    # Check if config already exists
    cursor.execute("SELECT COUNT(*) FROM repository_config")
    if cursor.fetchone()[0] > 0:
        print("Configuration already exists in database")
        conn.close()
        return
    
    now = datetime.utcnow().isoformat() + "Z"
    
    # Insert repository config
    cursor.execute("""
        INSERT INTO repository_config (schema_version, type_id, description, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?)
    """, (schema['schema_version'], schema['type_id'], schema['description'], now, now))
    config_id = cursor.lastrowid
    
    # Insert capabilities
    cursor.execute("""
        INSERT INTO capabilities (config_id, protocols, storage, features)
        VALUES (?, ?, ?, ?)
    """, (
        config_id,
        json.dumps(schema['capabilities']['protocols']),
        json.dumps(schema['capabilities']['storage']),
        json.dumps(schema['capabilities']['features'])
    ))
    
    # Insert entities
    for entity_name, entity_data in schema['entities'].items():
        if entity_name == 'versioning':
            continue
        
        cursor.execute("""
            INSERT INTO entities (config_id, name, type, primary_key, created_at)
            VALUES (?, ?, ?, ?, ?)
        """, (
            config_id,
            entity_name,
            'artifact',
            json.dumps(entity_data.get('primary_key', [])),
            now
        ))
        entity_id = cursor.lastrowid
        
        # Insert entity fields
        for field_name, field_data in entity_data.get('fields', {}).items():
            cursor.execute("""
                INSERT INTO entity_fields (entity_id, name, type, optional, normalizations)
                VALUES (?, ?, ?, ?, ?)
            """, (
                entity_id,
                field_name,
                field_data['type'],
                1 if field_data.get('optional', False) else 0,
                json.dumps(field_data.get('normalize', []))
            ))
        
        # Insert entity constraints
        for constraint in entity_data.get('constraints', []):
            cursor.execute("""
                INSERT INTO entity_constraints (entity_id, field, regex, when_present)
                VALUES (?, ?, ?, ?)
            """, (
                entity_id,
                constraint['field'],
                constraint['regex'],
                1 if constraint.get('when_present', False) else 0
            ))
    
    # Insert blob stores
    for store_name, store_data in schema['storage']['blob_stores'].items():
        cursor.execute("""
            INSERT INTO blob_stores (
                config_id, name, kind, root, addressing_mode, addressing_digest,
                path_template, max_blob_bytes, min_blob_bytes
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            config_id,
            store_name,
            store_data['kind'],
            store_data['root'],
            store_data['addressing'].get('mode'),
            store_data['addressing'].get('digest'),
            store_data['addressing'].get('path_template'),
            store_data['limits'].get('max_blob_bytes'),
            store_data['limits'].get('min_blob_bytes')
        ))
    
    # Insert KV stores
    for store_name, store_data in schema['storage']['kv_stores'].items():
        cursor.execute("""
            INSERT INTO kv_stores (config_id, name, kind, root)
            VALUES (?, ?, ?, ?)
        """, (config_id, store_name, store_data['kind'], store_data['root']))
    
    # Insert API routes
    for route in schema['api']['routes']:
        cursor.execute("""
            INSERT INTO api_routes (config_id, route_id, method, path, tags, pipeline, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            config_id,
            route['id'],
            route['method'],
            route['path'],
            json.dumps(route.get('tags', [])),
            json.dumps(route['pipeline']),
            now
        ))
    
    # Insert auth scopes
    for scope in schema['auth']['scopes']:
        cursor.execute("""
            INSERT INTO auth_scopes (config_id, name, actions)
            VALUES (?, ?, ?)
        """, (config_id, scope['name'], json.dumps(scope['actions'])))
    
    # Insert auth policies
    for policy in schema['auth']['policies']:
        cursor.execute("""
            INSERT INTO auth_policies (config_id, name, effect, conditions, requirements)
            VALUES (?, ?, ?, ?, ?)
        """, (
            config_id,
            policy['name'],
            policy['effect'],
            json.dumps(policy.get('when', {})),
            json.dumps(policy.get('require', {}))
        ))
    
    # Insert caching config
    caching = schema['caching']
    cursor.execute("""
        INSERT INTO caching_config (
            config_id, response_cache_enabled, response_cache_ttl,
            blob_cache_enabled, blob_cache_max_bytes
        )
        VALUES (?, ?, ?, ?, ?)
    """, (
        config_id,
        1 if caching['response_cache']['enabled'] else 0,
        caching['response_cache']['default_ttl_seconds'],
        1 if caching['blob_cache']['enabled'] else 0,
        caching['blob_cache']['max_bytes']
    ))
    
    # Insert features config
    features = schema['features']
    cursor.execute("""
        INSERT INTO features_config (
            config_id, mutable_tags, allow_overwrite_artifacts, proxy_enabled, gc_enabled
        )
        VALUES (?, ?, ?, ?, ?)
    """, (
        config_id,
        1 if features['mutable_tags'] else 0,
        1 if features['allow_overwrite_artifacts'] else 0,
        1 if features['proxy_enabled'] else 0,
        1 if schema['gc']['enabled'] else 0
    ))
    
    conn.commit()
    conn.close()
    print("Schema loaded into database successfully")


def get_repository_config() -> Optional[Dict[str, Any]]:
    """Get the current repository configuration."""
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM repository_config LIMIT 1")
    config_row = cursor.fetchone()
    
    if not config_row:
        conn.close()
        return None
    
    config = dict(config_row)
    config_id = config['id']
    
    # Get capabilities
    cursor.execute("SELECT * FROM capabilities WHERE config_id = ?", (config_id,))
    cap_row = cursor.fetchone()
    if cap_row:
        config['capabilities'] = {
            'protocols': json.loads(cap_row['protocols']),
            'storage': json.loads(cap_row['storage']),
            'features': json.loads(cap_row['features'])
        }
    
    # Get entities
    cursor.execute("SELECT * FROM entities WHERE config_id = ?", (config_id,))
    entities = []
    for entity_row in cursor.fetchall():
        entity = dict(entity_row)
        entity_id = entity['id']
        
        # Get fields
        cursor.execute("SELECT * FROM entity_fields WHERE entity_id = ?", (entity_id,))
        entity['fields'] = [dict(row) for row in cursor.fetchall()]
        
        # Get constraints
        cursor.execute("SELECT * FROM entity_constraints WHERE entity_id = ?", (entity_id,))
        entity['constraints'] = [dict(row) for row in cursor.fetchall()]
        
        entities.append(entity)
    
    config['entities'] = entities
    
    # Get blob stores
    cursor.execute("SELECT * FROM blob_stores WHERE config_id = ?", (config_id,))
    config['blob_stores'] = [dict(row) for row in cursor.fetchall()]
    
    # Get KV stores
    cursor.execute("SELECT * FROM kv_stores WHERE config_id = ?", (config_id,))
    config['kv_stores'] = [dict(row) for row in cursor.fetchall()]
    
    # Get API routes
    cursor.execute("SELECT * FROM api_routes WHERE config_id = ?", (config_id,))
    config['api_routes'] = [dict(row) for row in cursor.fetchall()]
    
    # Get auth scopes
    cursor.execute("SELECT * FROM auth_scopes WHERE config_id = ?", (config_id,))
    config['auth_scopes'] = [dict(row) for row in cursor.fetchall()]
    
    # Get auth policies
    cursor.execute("SELECT * FROM auth_policies WHERE config_id = ?", (config_id,))
    config['auth_policies'] = [dict(row) for row in cursor.fetchall()]
    
    # Get caching config
    cursor.execute("SELECT * FROM caching_config WHERE config_id = ?", (config_id,))
    cache_row = cursor.fetchone()
    if cache_row:
        config['caching'] = dict(cache_row)
    
    # Get features config
    cursor.execute("SELECT * FROM features_config WHERE config_id = ?", (config_id,))
    features_row = cursor.fetchone()
    if features_row:
        config['features'] = dict(features_row)
    
    conn.close()
    return config


# Initialize on import
init_config_db()

# Load schema if database is empty
schema_path = Path(__file__).parent.parent / "schema.json"
if schema_path.exists():
    load_schema_to_db(schema_path)
