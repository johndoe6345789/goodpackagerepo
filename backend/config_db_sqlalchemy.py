"""
Database models for repository configuration using SQLAlchemy.
Stores schema.json configuration in SQLite for dynamic management.
"""

import json
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, List, Optional
from models import (
    ConfigSession, RepositoryConfig, Capability, Entity, EntityField, EntityConstraint,
    BlobStore, KVStore, APIRoute, AuthScope, AuthPolicy, CachingConfig, FeaturesConfig,
    DocumentConfig, StorageSchema, Index, IndexKey, Upstream, EventType, ReplicationConfig,
    GCConfig, OpsLimits, AllowedOp, Invariant, ValidationRule, VersioningConfig
)


def load_schema_to_db(schema_path: Path):
    """Load schema.json into the database using SQLAlchemy."""
    with open(schema_path) as f:
        schema = json.load(f)
    
    session = ConfigSession()
    try:
        # Check if config already exists
        existing = session.query(RepositoryConfig).first()
        if existing:
            print("Configuration already exists in database")
            return
        
        now = datetime.utcnow().isoformat() + "Z"
        
        # Create repository config
        config = RepositoryConfig(
            schema_version=schema['schema_version'],
            type_id=schema['type_id'],
            description=schema['description'],
            created_at=now,
            updated_at=now
        )
        session.add(config)
        session.flush()  # Get the config.id
        
        # Add capabilities
        capability = Capability(
            config_id=config.id,
            protocols=json.dumps(schema['capabilities']['protocols']),
            storage=json.dumps(schema['capabilities']['storage']),
            features=json.dumps(schema['capabilities']['features'])
        )
        session.add(capability)
        
        # Add entities
        for entity_name, entity_data in schema['entities'].items():
            if entity_name == 'versioning':
                continue
            
            entity = Entity(
                config_id=config.id,
                name=entity_name,
                type='artifact',
                primary_key=json.dumps(entity_data.get('primary_key', [])),
                created_at=now
            )
            session.add(entity)
            session.flush()
            
            # Add entity fields
            for field_name, field_data in entity_data.get('fields', {}).items():
                field = EntityField(
                    entity_id=entity.id,
                    name=field_name,
                    type=field_data['type'],
                    optional=1 if field_data.get('optional', False) else 0,
                    normalizations=json.dumps(field_data.get('normalize', []))
                )
                session.add(field)
            
            # Add entity constraints
            for constraint in entity_data.get('constraints', []):
                constraint_obj = EntityConstraint(
                    entity_id=entity.id,
                    field=constraint['field'],
                    regex=constraint['regex'],
                    when_present=1 if constraint.get('when_present', False) else 0
                )
                session.add(constraint_obj)
        
        # Add blob stores
        for store_name, store_data in schema['storage']['blob_stores'].items():
            blob_store = BlobStore(
                config_id=config.id,
                name=store_name,
                kind=store_data['kind'],
                root=store_data['root'],
                addressing_mode=store_data['addressing'].get('mode'),
                addressing_digest=store_data['addressing'].get('digest'),
                path_template=store_data['addressing'].get('path_template'),
                max_blob_bytes=store_data['limits'].get('max_blob_bytes'),
                min_blob_bytes=store_data['limits'].get('min_blob_bytes')
            )
            session.add(blob_store)
        
        # Add KV stores
        for store_name, store_data in schema['storage']['kv_stores'].items():
            kv_store = KVStore(
                config_id=config.id,
                name=store_name,
                kind=store_data['kind'],
                root=store_data['root']
            )
            session.add(kv_store)
        
        # Add API routes
        for route in schema['api']['routes']:
            api_route = APIRoute(
                config_id=config.id,
                route_id=route['id'],
                method=route['method'],
                path=route['path'],
                tags=json.dumps(route.get('tags', [])),
                pipeline=json.dumps(route['pipeline']),
                created_at=now
            )
            session.add(api_route)
        
        # Add auth scopes
        for scope in schema['auth']['scopes']:
            auth_scope = AuthScope(
                config_id=config.id,
                name=scope['name'],
                actions=json.dumps(scope['actions'])
            )
            session.add(auth_scope)
        
        # Add auth policies
        for policy in schema['auth']['policies']:
            auth_policy = AuthPolicy(
                config_id=config.id,
                name=policy['name'],
                effect=policy['effect'],
                conditions=json.dumps(policy.get('when', {})),
                requirements=json.dumps(policy.get('require', {}))
            )
            session.add(auth_policy)
        
        # Add caching config
        caching = schema['caching']
        caching_config = CachingConfig(
            config_id=config.id,
            response_cache_enabled=1 if caching['response_cache']['enabled'] else 0,
            response_cache_ttl=caching['response_cache']['default_ttl_seconds'],
            blob_cache_enabled=1 if caching['blob_cache']['enabled'] else 0,
            blob_cache_max_bytes=caching['blob_cache']['max_bytes']
        )
        session.add(caching_config)
        
        # Add features config
        features = schema['features']
        features_config = FeaturesConfig(
            config_id=config.id,
            mutable_tags=1 if features['mutable_tags'] else 0,
            allow_overwrite_artifacts=1 if features['allow_overwrite_artifacts'] else 0,
            proxy_enabled=1 if features['proxy_enabled'] else 0,
            gc_enabled=1 if schema['gc']['enabled'] else 0
        )
        session.add(features_config)
        
        # Add document configs
        for doc_name, doc_data in schema['storage'].get('documents', {}).items():
            doc_config = DocumentConfig(
                config_id=config.id,
                name=doc_name,
                store=doc_data['store'],
                key_template=doc_data['key_template'],
                schema_name=doc_data['schema']
            )
            session.add(doc_config)
        
        # Add storage schemas
        for schema_name, schema_def in schema['storage'].get('schemas', {}).items():
            storage_schema = StorageSchema(
                config_id=config.id,
                name=schema_name,
                schema_definition=json.dumps(schema_def)
            )
            session.add(storage_schema)
        
        # Add indexes
        for index_name, index_data in schema.get('indexes', {}).items():
            index = Index(
                config_id=config.id,
                name=index_name,
                source_document=index_data['source_document'],
                materialization_mode=index_data['materialization'].get('mode'),
                materialization_trigger=index_data['materialization'].get('trigger')
            )
            session.add(index)
            session.flush()
            
            # Add index keys
            for key in index_data.get('keys', []):
                index_key = IndexKey(
                    index_id=index.id,
                    name=key['name'],
                    fields=json.dumps(key['fields']),
                    sort=json.dumps(key.get('sort', [])),
                    unique_key=1 if key.get('unique', False) else 0
                )
                session.add(index_key)
        
        # Add upstreams
        for upstream_name, upstream_data in schema.get('upstreams', {}).items():
            upstream = Upstream(
                config_id=config.id,
                name=upstream_name,
                base_url=upstream_data['base_url'],
                auth_mode=upstream_data.get('auth', {}).get('mode'),
                connect_timeout_ms=upstream_data.get('timeouts_ms', {}).get('connect'),
                read_timeout_ms=upstream_data.get('timeouts_ms', {}).get('read'),
                retry_max_attempts=upstream_data.get('retry', {}).get('max_attempts'),
                retry_backoff_ms=upstream_data.get('retry', {}).get('backoff_ms')
            )
            session.add(upstream)
        
        # Add event types
        for event in schema.get('events', {}).get('types', []):
            event_type = EventType(
                config_id=config.id,
                name=event['name'],
                durable=1 if event.get('durable', True) else 0,
                schema_definition=json.dumps(event.get('schema', {}))
            )
            session.add(event_type)
        
        # Add replication config
        replication = schema.get('replication', {})
        if replication:
            replication_config = ReplicationConfig(
                config_id=config.id,
                mode=replication.get('mode'),
                log_store=replication.get('log', {}).get('store'),
                log_key_prefix=replication.get('log', {}).get('key_prefix'),
                log_ordering=replication.get('log', {}).get('ordering'),
                log_max_event_bytes=replication.get('log', {}).get('max_event_bytes'),
                shipping_strategy=replication.get('shipping', {}).get('strategy'),
                shipping_dedupe_enabled=1 if replication.get('shipping', {}).get('dedupe', {}).get('enabled', False) else 0,
                shipping_batch_max_events=replication.get('shipping', {}).get('batch', {}).get('max_events'),
                shipping_batch_max_bytes=replication.get('shipping', {}).get('batch', {}).get('max_bytes')
            )
            session.add(replication_config)
        
        # Add GC config
        gc = schema.get('gc', {})
        if gc:
            gc_config = GCConfig(
                config_id=config.id,
                enabled=1 if gc.get('enabled', True) else 0,
                immutable_after_publish=1 if gc.get('retention', {}).get('immutable_after_publish', True) else 0,
                keep_last_n_versions=gc.get('retention', {}).get('keep_last_n_versions'),
                keep_tags_forever=1 if gc.get('retention', {}).get('keep_tags_forever', True) else 0,
                sweep_schedule_rrule=gc.get('sweep', {}).get('schedule', {}).get('rrule'),
                sweep_unreferenced_after_seconds=gc.get('sweep', {}).get('sweep_unreferenced_after_seconds')
            )
            session.add(gc_config)
        
        # Add ops limits
        ops = schema.get('ops', {})
        if ops:
            ops_limits = OpsLimits(
                config_id=config.id,
                closed_world=1 if ops.get('closed_world', True) else 0,
                max_pipeline_ops=ops.get('limits', {}).get('max_pipeline_ops'),
                max_request_body_bytes=ops.get('limits', {}).get('max_request_body_bytes'),
                max_json_bytes=ops.get('limits', {}).get('max_json_bytes'),
                max_kv_value_bytes=ops.get('limits', {}).get('max_kv_value_bytes'),
                max_cpu_ms_per_request=ops.get('limits', {}).get('max_cpu_ms_per_request'),
                max_io_ops_per_request=ops.get('limits', {}).get('max_io_ops_per_request')
            )
            session.add(ops_limits)
            
            # Add allowed operations
            for op in ops.get('allowed', []):
                allowed_op = AllowedOp(
                    config_id=config.id,
                    operation=op
                )
                session.add(allowed_op)
        
        # Add invariants
        for invariant in schema.get('invariants', {}).get('global', []):
            invariant_obj = Invariant(
                config_id=config.id,
                invariant_id=invariant['id'],
                description=invariant['description'],
                assertion=json.dumps(invariant['assert'])
            )
            session.add(invariant_obj)
        
        # Add validation rules
        validation = schema.get('validation', {})
        for rule in validation.get('load_time_checks', []):
            validation_rule = ValidationRule(
                config_id=config.id,
                rule_id=rule['id'],
                rule_type='load_time',
                requirement=json.dumps(rule['require']),
                on_fail=rule['on_fail']
            )
            session.add(validation_rule)
        
        for rule in validation.get('runtime_checks', []):
            validation_rule = ValidationRule(
                config_id=config.id,
                rule_id=rule['id'],
                rule_type='runtime',
                requirement=json.dumps(rule['require']),
                on_fail=rule['on_fail']
            )
            session.add(validation_rule)
        
        # Add versioning config
        versioning = schema.get('entities', {}).get('versioning', {})
        if versioning:
            versioning_config = VersioningConfig(
                config_id=config.id,
                scheme=versioning.get('scheme'),
                ordering=versioning.get('ordering'),
                allow_prerelease=1 if versioning.get('allow_prerelease', False) else 0,
                latest_policy_enabled=1 if versioning.get('latest_policy', {}).get('enabled', True) else 0,
                latest_policy_monotonic=1 if versioning.get('latest_policy', {}).get('monotonic', True) else 0,
                latest_policy_exclude_prerelease=1 if versioning.get('latest_policy', {}).get('exclude_prerelease', True) else 0
            )
            session.add(versioning_config)
        
        session.commit()
        print("Schema loaded into database successfully")
    except Exception as e:
        session.rollback()
        print(f"Error loading schema: {e}")
        raise
    finally:
        session.close()


def get_repository_config() -> Optional[Dict[str, Any]]:
    """Get the current repository configuration."""
    session = ConfigSession()
    try:
        config = session.query(RepositoryConfig).first()
        
        if not config:
            return None
        
        config_dict = {
            'id': config.id,
            'schema_version': config.schema_version,
            'type_id': config.type_id,
            'description': config.description,
            'created_at': config.created_at,
            'updated_at': config.updated_at
        }
        
        # Get capabilities
        if config.capabilities:
            cap = config.capabilities[0]
            config_dict['capabilities'] = {
                'protocols': json.loads(cap.protocols),
                'storage': json.loads(cap.storage),
                'features': json.loads(cap.features)
            }
        
        # Get entities
        entities = []
        for entity in config.entities:
            entity_dict = {
                'id': entity.id,
                'name': entity.name,
                'type': entity.type,
                'primary_key': entity.primary_key,
                'created_at': entity.created_at,
                'fields': [],
                'constraints': []
            }
            
            # Get fields
            for field in entity.fields:
                entity_dict['fields'].append({
                    'id': field.id,
                    'name': field.name,
                    'type': field.type,
                    'optional': field.optional,
                    'normalizations': field.normalizations
                })
            
            # Get constraints
            for constraint in entity.constraints:
                entity_dict['constraints'].append({
                    'id': constraint.id,
                    'field': constraint.field,
                    'regex': constraint.regex,
                    'when_present': constraint.when_present
                })
            
            entities.append(entity_dict)
        
        config_dict['entities'] = entities
        
        # Get blob stores
        config_dict['blob_stores'] = [
            {
                'id': bs.id,
                'name': bs.name,
                'kind': bs.kind,
                'root': bs.root,
                'addressing_mode': bs.addressing_mode,
                'addressing_digest': bs.addressing_digest,
                'path_template': bs.path_template,
                'max_blob_bytes': bs.max_blob_bytes,
                'min_blob_bytes': bs.min_blob_bytes
            }
            for bs in config.blob_stores
        ]
        
        # Get KV stores
        config_dict['kv_stores'] = [
            {'id': kv.id, 'name': kv.name, 'kind': kv.kind, 'root': kv.root}
            for kv in config.kv_stores
        ]
        
        # Get API routes
        config_dict['api_routes'] = [
            {
                'id': route.id,
                'route_id': route.route_id,
                'method': route.method,
                'path': route.path,
                'tags': route.tags,
                'pipeline': route.pipeline,
                'created_at': route.created_at
            }
            for route in config.api_routes
        ]
        
        # Get auth scopes
        config_dict['auth_scopes'] = [
            {'id': scope.id, 'name': scope.name, 'actions': scope.actions}
            for scope in config.auth_scopes
        ]
        
        # Get auth policies
        config_dict['auth_policies'] = [
            {
                'id': policy.id,
                'name': policy.name,
                'effect': policy.effect,
                'conditions': policy.conditions,
                'requirements': policy.requirements
            }
            for policy in config.auth_policies
        ]
        
        return config_dict
    finally:
        session.close()


# Load schema if database is empty
schema_path = Path(__file__).parent.parent / "schema.json"
if schema_path.exists():
    load_schema_to_db(schema_path)
