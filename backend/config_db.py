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
    
    # Document schemas (for storage.documents)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS document_configs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            config_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            store TEXT NOT NULL,
            key_template TEXT NOT NULL,
            schema_name TEXT NOT NULL,
            FOREIGN KEY (config_id) REFERENCES repository_config(id) ON DELETE CASCADE
        )
    """)
    
    # Storage schemas (for storage.schemas)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS storage_schemas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            config_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            schema_definition TEXT NOT NULL,
            FOREIGN KEY (config_id) REFERENCES repository_config(id) ON DELETE CASCADE
        )
    """)
    
    # Indexes
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS indexes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            config_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            source_document TEXT NOT NULL,
            materialization_mode TEXT,
            materialization_trigger TEXT,
            FOREIGN KEY (config_id) REFERENCES repository_config(id) ON DELETE CASCADE
        )
    """)
    
    # Index keys
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS index_keys (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            index_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            fields TEXT NOT NULL,
            sort TEXT,
            unique_key INTEGER DEFAULT 0,
            FOREIGN KEY (index_id) REFERENCES indexes(id) ON DELETE CASCADE
        )
    """)
    
    # Upstreams
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS upstreams (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            config_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            base_url TEXT NOT NULL,
            auth_mode TEXT,
            connect_timeout_ms INTEGER,
            read_timeout_ms INTEGER,
            retry_max_attempts INTEGER,
            retry_backoff_ms INTEGER,
            FOREIGN KEY (config_id) REFERENCES repository_config(id) ON DELETE CASCADE
        )
    """)
    
    # Event types
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS event_types (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            config_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            durable INTEGER DEFAULT 1,
            schema_definition TEXT,
            FOREIGN KEY (config_id) REFERENCES repository_config(id) ON DELETE CASCADE
        )
    """)
    
    # Replication configuration
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS replication_config (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            config_id INTEGER NOT NULL,
            mode TEXT NOT NULL,
            log_store TEXT,
            log_key_prefix TEXT,
            log_ordering TEXT,
            log_max_event_bytes INTEGER,
            shipping_strategy TEXT,
            shipping_dedupe_enabled INTEGER,
            shipping_batch_max_events INTEGER,
            shipping_batch_max_bytes INTEGER,
            FOREIGN KEY (config_id) REFERENCES repository_config(id) ON DELETE CASCADE
        )
    """)
    
    # GC (Garbage Collection) configuration
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS gc_config (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            config_id INTEGER NOT NULL,
            enabled INTEGER DEFAULT 1,
            immutable_after_publish INTEGER DEFAULT 1,
            keep_last_n_versions INTEGER DEFAULT 50,
            keep_tags_forever INTEGER DEFAULT 1,
            sweep_schedule_rrule TEXT,
            sweep_unreferenced_after_seconds INTEGER DEFAULT 604800,
            FOREIGN KEY (config_id) REFERENCES repository_config(id) ON DELETE CASCADE
        )
    """)
    
    # Ops limits
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS ops_limits (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            config_id INTEGER NOT NULL,
            closed_world INTEGER DEFAULT 1,
            max_pipeline_ops INTEGER DEFAULT 128,
            max_request_body_bytes INTEGER DEFAULT 2147483648,
            max_json_bytes INTEGER DEFAULT 10485760,
            max_kv_value_bytes INTEGER DEFAULT 1048576,
            max_cpu_ms_per_request INTEGER DEFAULT 200,
            max_io_ops_per_request INTEGER DEFAULT 5000,
            FOREIGN KEY (config_id) REFERENCES repository_config(id) ON DELETE CASCADE
        )
    """)
    
    # Allowed operations
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS allowed_ops (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            config_id INTEGER NOT NULL,
            operation TEXT NOT NULL,
            FOREIGN KEY (config_id) REFERENCES repository_config(id) ON DELETE CASCADE
        )
    """)
    
    # Invariants
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS invariants (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            config_id INTEGER NOT NULL,
            invariant_id TEXT NOT NULL,
            description TEXT NOT NULL,
            assertion TEXT NOT NULL,
            FOREIGN KEY (config_id) REFERENCES repository_config(id) ON DELETE CASCADE
        )
    """)
    
    # Validation rules
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS validation_rules (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            config_id INTEGER NOT NULL,
            rule_id TEXT NOT NULL,
            rule_type TEXT NOT NULL,
            requirement TEXT NOT NULL,
            on_fail TEXT NOT NULL,
            FOREIGN KEY (config_id) REFERENCES repository_config(id) ON DELETE CASCADE
        )
    """)
    
    # Versioning configuration
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS versioning_config (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            config_id INTEGER NOT NULL,
            scheme TEXT NOT NULL,
            ordering TEXT NOT NULL,
            allow_prerelease INTEGER DEFAULT 0,
            latest_policy_enabled INTEGER DEFAULT 1,
            latest_policy_monotonic INTEGER DEFAULT 1,
            latest_policy_exclude_prerelease INTEGER DEFAULT 1,
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
    
    # Insert document configs
    for doc_name, doc_data in schema['storage'].get('documents', {}).items():
        cursor.execute("""
            INSERT INTO document_configs (config_id, name, store, key_template, schema_name)
            VALUES (?, ?, ?, ?, ?)
        """, (config_id, doc_name, doc_data['store'], doc_data['key_template'], doc_data['schema']))
    
    # Insert storage schemas
    for schema_name, schema_def in schema['storage'].get('schemas', {}).items():
        cursor.execute("""
            INSERT INTO storage_schemas (config_id, name, schema_definition)
            VALUES (?, ?, ?)
        """, (config_id, schema_name, json.dumps(schema_def)))
    
    # Insert indexes
    for index_name, index_data in schema.get('indexes', {}).items():
        cursor.execute("""
            INSERT INTO indexes (config_id, name, source_document, materialization_mode, materialization_trigger)
            VALUES (?, ?, ?, ?, ?)
        """, (
            config_id,
            index_name,
            index_data['source_document'],
            index_data['materialization'].get('mode'),
            index_data['materialization'].get('trigger')
        ))
        index_id = cursor.lastrowid
        
        # Insert index keys
        for key in index_data.get('keys', []):
            cursor.execute("""
                INSERT INTO index_keys (index_id, name, fields, sort, unique_key)
                VALUES (?, ?, ?, ?, ?)
            """, (
                index_id,
                key['name'],
                json.dumps(key['fields']),
                json.dumps(key.get('sort', [])),
                1 if key.get('unique', False) else 0
            ))
    
    # Insert upstreams
    for upstream_name, upstream_data in schema.get('upstreams', {}).items():
        cursor.execute("""
            INSERT INTO upstreams (
                config_id, name, base_url, auth_mode,
                connect_timeout_ms, read_timeout_ms,
                retry_max_attempts, retry_backoff_ms
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            config_id,
            upstream_name,
            upstream_data['base_url'],
            upstream_data.get('auth', {}).get('mode'),
            upstream_data.get('timeouts_ms', {}).get('connect'),
            upstream_data.get('timeouts_ms', {}).get('read'),
            upstream_data.get('retry', {}).get('max_attempts'),
            upstream_data.get('retry', {}).get('backoff_ms')
        ))
    
    # Insert event types
    for event in schema.get('events', {}).get('types', []):
        cursor.execute("""
            INSERT INTO event_types (config_id, name, durable, schema_definition)
            VALUES (?, ?, ?, ?)
        """, (
            config_id,
            event['name'],
            1 if event.get('durable', True) else 0,
            json.dumps(event.get('schema', {}))
        ))
    
    # Insert replication config
    replication = schema.get('replication', {})
    if replication:
        cursor.execute("""
            INSERT INTO replication_config (
                config_id, mode, log_store, log_key_prefix, log_ordering,
                log_max_event_bytes, shipping_strategy, shipping_dedupe_enabled,
                shipping_batch_max_events, shipping_batch_max_bytes
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            config_id,
            replication.get('mode'),
            replication.get('log', {}).get('store'),
            replication.get('log', {}).get('key_prefix'),
            replication.get('log', {}).get('ordering'),
            replication.get('log', {}).get('max_event_bytes'),
            replication.get('shipping', {}).get('strategy'),
            1 if replication.get('shipping', {}).get('dedupe', {}).get('enabled', False) else 0,
            replication.get('shipping', {}).get('batch', {}).get('max_events'),
            replication.get('shipping', {}).get('batch', {}).get('max_bytes')
        ))
    
    # Insert GC config
    gc = schema.get('gc', {})
    if gc:
        cursor.execute("""
            INSERT INTO gc_config (
                config_id, enabled, immutable_after_publish, keep_last_n_versions,
                keep_tags_forever, sweep_schedule_rrule, sweep_unreferenced_after_seconds
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            config_id,
            1 if gc.get('enabled', True) else 0,
            1 if gc.get('retention', {}).get('immutable_after_publish', True) else 0,
            gc.get('retention', {}).get('keep_last_n_versions'),
            1 if gc.get('retention', {}).get('keep_tags_forever', True) else 0,
            gc.get('sweep', {}).get('schedule', {}).get('rrule'),
            gc.get('sweep', {}).get('sweep_unreferenced_after_seconds')
        ))
    
    # Insert ops limits
    ops = schema.get('ops', {})
    if ops:
        cursor.execute("""
            INSERT INTO ops_limits (
                config_id, closed_world, max_pipeline_ops, max_request_body_bytes,
                max_json_bytes, max_kv_value_bytes, max_cpu_ms_per_request,
                max_io_ops_per_request
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            config_id,
            1 if ops.get('closed_world', True) else 0,
            ops.get('limits', {}).get('max_pipeline_ops'),
            ops.get('limits', {}).get('max_request_body_bytes'),
            ops.get('limits', {}).get('max_json_bytes'),
            ops.get('limits', {}).get('max_kv_value_bytes'),
            ops.get('limits', {}).get('max_cpu_ms_per_request'),
            ops.get('limits', {}).get('max_io_ops_per_request')
        ))
        
        # Insert allowed operations
        for op in ops.get('allowed', []):
            cursor.execute("""
                INSERT INTO allowed_ops (config_id, operation)
                VALUES (?, ?)
            """, (config_id, op))
    
    # Insert invariants
    for invariant in schema.get('invariants', {}).get('global', []):
        cursor.execute("""
            INSERT INTO invariants (config_id, invariant_id, description, assertion)
            VALUES (?, ?, ?, ?)
        """, (
            config_id,
            invariant['id'],
            invariant['description'],
            json.dumps(invariant['assert'])
        ))
    
    # Insert validation rules
    validation = schema.get('validation', {})
    for rule in validation.get('load_time_checks', []):
        cursor.execute("""
            INSERT INTO validation_rules (config_id, rule_id, rule_type, requirement, on_fail)
            VALUES (?, ?, ?, ?, ?)
        """, (
            config_id,
            rule['id'],
            'load_time',
            json.dumps(rule['require']),
            rule['on_fail']
        ))
    
    for rule in validation.get('runtime_checks', []):
        cursor.execute("""
            INSERT INTO validation_rules (config_id, rule_id, rule_type, requirement, on_fail)
            VALUES (?, ?, ?, ?, ?)
        """, (
            config_id,
            rule['id'],
            'runtime',
            json.dumps(rule['require']),
            rule['on_fail']
        ))
    
    # Insert versioning config
    versioning = schema.get('entities', {}).get('versioning', {})
    if versioning:
        cursor.execute("""
            INSERT INTO versioning_config (
                config_id, scheme, ordering, allow_prerelease,
                latest_policy_enabled, latest_policy_monotonic, latest_policy_exclude_prerelease
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            config_id,
            versioning.get('scheme'),
            versioning.get('ordering'),
            1 if versioning.get('allow_prerelease', False) else 0,
            1 if versioning.get('latest_policy', {}).get('enabled', True) else 0,
            1 if versioning.get('latest_policy', {}).get('monotonic', True) else 0,
            1 if versioning.get('latest_policy', {}).get('exclude_prerelease', True) else 0
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
