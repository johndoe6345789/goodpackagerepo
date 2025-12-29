"""
SQLAlchemy models for goodpackagerepo.

This module defines the database schema using SQLAlchemy ORM.
"""

from datetime import datetime
from sqlalchemy import (
    create_engine, Column, Integer, String, Text, Boolean, ForeignKey
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship, sessionmaker
from pathlib import Path

# Database paths
USERS_DB_PATH = Path(__file__).parent / "users.db"
CONFIG_DB_PATH = Path(__file__).parent / "config.db"

# Create engines
users_engine = create_engine(f'sqlite:///{USERS_DB_PATH}', echo=False)
config_engine = create_engine(f'sqlite:///{CONFIG_DB_PATH}', echo=False)

# Create session makers
UsersSession = sessionmaker(bind=users_engine)
ConfigSession = sessionmaker(bind=config_engine)

# Base classes
Base = declarative_base()
ConfigBase = declarative_base()


# ============================================================================
# User Management Models
# ============================================================================

class User(Base):
    """User model for authentication."""
    __tablename__ = 'users'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    scopes = Column(String(512), nullable=False)
    created_at = Column(String(64), nullable=False)
    updated_at = Column(String(64), nullable=False)
    
    def __repr__(self):
        return f"<User(username='{self.username}', scopes='{self.scopes}')>"


# ============================================================================
# Configuration Models
# ============================================================================

class RepositoryConfig(ConfigBase):
    """Main repository configuration."""
    __tablename__ = 'repository_config'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    schema_version = Column(String(32), nullable=False)
    type_id = Column(String(255), nullable=False)
    description = Column(Text)
    created_at = Column(String(64), nullable=False)
    updated_at = Column(String(64), nullable=False)
    
    # Relationships
    capabilities = relationship("Capability", back_populates="config", cascade="all, delete-orphan")
    entities = relationship("Entity", back_populates="config", cascade="all, delete-orphan")
    blob_stores = relationship("BlobStore", back_populates="config", cascade="all, delete-orphan")
    kv_stores = relationship("KVStore", back_populates="config", cascade="all, delete-orphan")
    api_routes = relationship("APIRoute", back_populates="config", cascade="all, delete-orphan")
    auth_scopes = relationship("AuthScope", back_populates="config", cascade="all, delete-orphan")
    auth_policies = relationship("AuthPolicy", back_populates="config", cascade="all, delete-orphan")


class Capability(ConfigBase):
    """System capabilities."""
    __tablename__ = 'capabilities'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    config_id = Column(Integer, ForeignKey('repository_config.id', ondelete='CASCADE'), nullable=False)
    protocols = Column(Text, nullable=False)  # JSON
    storage = Column(Text, nullable=False)  # JSON
    features = Column(Text, nullable=False)  # JSON
    
    config = relationship("RepositoryConfig", back_populates="capabilities")


class Entity(ConfigBase):
    """Entity definitions."""
    __tablename__ = 'entities'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    config_id = Column(Integer, ForeignKey('repository_config.id', ondelete='CASCADE'), nullable=False)
    name = Column(String(255), nullable=False)
    type = Column(String(255), nullable=False)
    primary_key = Column(Text)  # JSON
    created_at = Column(String(64), nullable=False)
    
    config = relationship("RepositoryConfig", back_populates="entities")
    fields = relationship("EntityField", back_populates="entity", cascade="all, delete-orphan")
    constraints = relationship("EntityConstraint", back_populates="entity", cascade="all, delete-orphan")


class EntityField(ConfigBase):
    """Entity field definitions."""
    __tablename__ = 'entity_fields'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    entity_id = Column(Integer, ForeignKey('entities.id', ondelete='CASCADE'), nullable=False)
    name = Column(String(255), nullable=False)
    type = Column(String(64), nullable=False)
    optional = Column(Boolean, default=False)
    normalizations = Column(Text)  # JSON
    
    entity = relationship("Entity", back_populates="fields")


class EntityConstraint(ConfigBase):
    """Entity constraints."""
    __tablename__ = 'entity_constraints'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    entity_id = Column(Integer, ForeignKey('entities.id', ondelete='CASCADE'), nullable=False)
    field = Column(String(255), nullable=False)
    regex = Column(Text, nullable=False)
    when_present = Column(Boolean, default=False)
    
    entity = relationship("Entity", back_populates="constraints")


class BlobStore(ConfigBase):
    """Blob store configurations."""
    __tablename__ = 'blob_stores'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    config_id = Column(Integer, ForeignKey('repository_config.id', ondelete='CASCADE'), nullable=False)
    name = Column(String(255), nullable=False)
    kind = Column(String(64), nullable=False)
    root = Column(String(512), nullable=False)
    addressing_mode = Column(String(64))
    addressing_digest = Column(String(64))
    path_template = Column(String(512))
    max_blob_bytes = Column(Integer)
    min_blob_bytes = Column(Integer)
    
    config = relationship("RepositoryConfig", back_populates="blob_stores")


class KVStore(ConfigBase):
    """Key-value store configurations."""
    __tablename__ = 'kv_stores'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    config_id = Column(Integer, ForeignKey('repository_config.id', ondelete='CASCADE'), nullable=False)
    name = Column(String(255), nullable=False)
    kind = Column(String(64), nullable=False)
    root = Column(String(512), nullable=False)
    
    config = relationship("RepositoryConfig", back_populates="kv_stores")


class APIRoute(ConfigBase):
    """API route definitions."""
    __tablename__ = 'api_routes'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    config_id = Column(Integer, ForeignKey('repository_config.id', ondelete='CASCADE'), nullable=False)
    route_id = Column(String(255), nullable=False)
    method = Column(String(16), nullable=False)
    path = Column(String(512), nullable=False)
    tags = Column(Text)  # JSON
    pipeline = Column(Text, nullable=False)  # JSON
    created_at = Column(String(64), nullable=False)
    
    config = relationship("RepositoryConfig", back_populates="api_routes")


class AuthScope(ConfigBase):
    """Authentication scopes."""
    __tablename__ = 'auth_scopes'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    config_id = Column(Integer, ForeignKey('repository_config.id', ondelete='CASCADE'), nullable=False)
    name = Column(String(255), nullable=False)
    actions = Column(Text, nullable=False)  # JSON
    
    config = relationship("RepositoryConfig", back_populates="auth_scopes")


class AuthPolicy(ConfigBase):
    """Authentication policies."""
    __tablename__ = 'auth_policies'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    config_id = Column(Integer, ForeignKey('repository_config.id', ondelete='CASCADE'), nullable=False)
    name = Column(String(255), nullable=False)
    effect = Column(String(32), nullable=False)
    conditions = Column(Text)  # JSON
    requirements = Column(Text)  # JSON
    
    config = relationship("RepositoryConfig", back_populates="auth_policies")


class CachingConfig(ConfigBase):
    """Caching configuration."""
    __tablename__ = 'caching_config'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    config_id = Column(Integer, ForeignKey('repository_config.id', ondelete='CASCADE'), nullable=False)
    response_cache_enabled = Column(Integer, default=1)
    response_cache_ttl = Column(Integer, default=300)
    blob_cache_enabled = Column(Integer, default=1)
    blob_cache_max_bytes = Column(Integer)


class FeaturesConfig(ConfigBase):
    """Features configuration."""
    __tablename__ = 'features_config'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    config_id = Column(Integer, ForeignKey('repository_config.id', ondelete='CASCADE'), nullable=False)
    mutable_tags = Column(Integer, default=1)
    allow_overwrite_artifacts = Column(Integer, default=0)
    proxy_enabled = Column(Integer, default=1)
    gc_enabled = Column(Integer, default=1)


class DocumentConfig(ConfigBase):
    """Document configurations."""
    __tablename__ = 'document_configs'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    config_id = Column(Integer, ForeignKey('repository_config.id', ondelete='CASCADE'), nullable=False)
    name = Column(String(255), nullable=False)
    store = Column(String(255), nullable=False)
    key_template = Column(String(512), nullable=False)
    schema_name = Column(String(255), nullable=False)


class StorageSchema(ConfigBase):
    """Storage schemas."""
    __tablename__ = 'storage_schemas'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    config_id = Column(Integer, ForeignKey('repository_config.id', ondelete='CASCADE'), nullable=False)
    name = Column(String(255), nullable=False)
    schema_definition = Column(Text, nullable=False)  # JSON


class Index(ConfigBase):
    """Index configurations."""
    __tablename__ = 'indexes'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    config_id = Column(Integer, ForeignKey('repository_config.id', ondelete='CASCADE'), nullable=False)
    name = Column(String(255), nullable=False)
    source_document = Column(String(255), nullable=False)
    materialization_mode = Column(String(64))
    materialization_trigger = Column(String(64))
    
    keys = relationship("IndexKey", back_populates="index", cascade="all, delete-orphan")


class IndexKey(ConfigBase):
    """Index key definitions."""
    __tablename__ = 'index_keys'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    index_id = Column(Integer, ForeignKey('indexes.id', ondelete='CASCADE'), nullable=False)
    name = Column(String(255), nullable=False)
    fields = Column(Text, nullable=False)  # JSON
    sort = Column(Text)  # JSON
    unique_key = Column(Integer, default=0)
    
    index = relationship("Index", back_populates="keys")


class Upstream(ConfigBase):
    """Upstream repository configurations."""
    __tablename__ = 'upstreams'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    config_id = Column(Integer, ForeignKey('repository_config.id', ondelete='CASCADE'), nullable=False)
    name = Column(String(255), nullable=False)
    base_url = Column(String(512), nullable=False)
    auth_mode = Column(String(64))
    connect_timeout_ms = Column(Integer)
    read_timeout_ms = Column(Integer)
    retry_max_attempts = Column(Integer)
    retry_backoff_ms = Column(Integer)


class EventType(ConfigBase):
    """Event type definitions."""
    __tablename__ = 'event_types'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    config_id = Column(Integer, ForeignKey('repository_config.id', ondelete='CASCADE'), nullable=False)
    name = Column(String(255), nullable=False)
    durable = Column(Integer, default=1)
    schema_definition = Column(Text)  # JSON


class ReplicationConfig(ConfigBase):
    """Replication configuration."""
    __tablename__ = 'replication_config'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    config_id = Column(Integer, ForeignKey('repository_config.id', ondelete='CASCADE'), nullable=False)
    mode = Column(String(64), nullable=False)
    log_store = Column(String(255))
    log_key_prefix = Column(String(255))
    log_ordering = Column(String(64))
    log_max_event_bytes = Column(Integer)
    shipping_strategy = Column(String(64))
    shipping_dedupe_enabled = Column(Integer)
    shipping_batch_max_events = Column(Integer)
    shipping_batch_max_bytes = Column(Integer)


class GCConfig(ConfigBase):
    """Garbage collection configuration."""
    __tablename__ = 'gc_config'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    config_id = Column(Integer, ForeignKey('repository_config.id', ondelete='CASCADE'), nullable=False)
    enabled = Column(Integer, default=1)
    immutable_after_publish = Column(Integer, default=1)
    keep_last_n_versions = Column(Integer, default=50)
    keep_tags_forever = Column(Integer, default=1)
    sweep_schedule_rrule = Column(Text)
    sweep_unreferenced_after_seconds = Column(Integer, default=604800)


class OpsLimits(ConfigBase):
    """Operations limits configuration."""
    __tablename__ = 'ops_limits'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    config_id = Column(Integer, ForeignKey('repository_config.id', ondelete='CASCADE'), nullable=False)
    closed_world = Column(Integer, default=1)
    max_pipeline_ops = Column(Integer, default=128)
    max_request_body_bytes = Column(Integer, default=2147483648)
    max_json_bytes = Column(Integer, default=10485760)
    max_kv_value_bytes = Column(Integer, default=1048576)
    max_cpu_ms_per_request = Column(Integer, default=200)
    max_io_ops_per_request = Column(Integer, default=5000)


class AllowedOp(ConfigBase):
    """Allowed operations."""
    __tablename__ = 'allowed_ops'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    config_id = Column(Integer, ForeignKey('repository_config.id', ondelete='CASCADE'), nullable=False)
    operation = Column(String(255), nullable=False)


class Invariant(ConfigBase):
    """System invariants."""
    __tablename__ = 'invariants'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    config_id = Column(Integer, ForeignKey('repository_config.id', ondelete='CASCADE'), nullable=False)
    invariant_id = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    assertion = Column(Text, nullable=False)  # JSON


class ValidationRule(ConfigBase):
    """Validation rules."""
    __tablename__ = 'validation_rules'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    config_id = Column(Integer, ForeignKey('repository_config.id', ondelete='CASCADE'), nullable=False)
    rule_id = Column(String(255), nullable=False)
    rule_type = Column(String(64), nullable=False)
    requirement = Column(Text, nullable=False)  # JSON
    on_fail = Column(String(64), nullable=False)


class VersioningConfig(ConfigBase):
    """Versioning configuration."""
    __tablename__ = 'versioning_config'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    config_id = Column(Integer, ForeignKey('repository_config.id', ondelete='CASCADE'), nullable=False)
    scheme = Column(String(64), nullable=False)
    ordering = Column(String(64), nullable=False)
    allow_prerelease = Column(Integer, default=0)
    latest_policy_enabled = Column(Integer, default=1)
    latest_policy_monotonic = Column(Integer, default=1)
    latest_policy_exclude_prerelease = Column(Integer, default=1)


# ============================================================================
# Database initialization
# ============================================================================

def init_all_databases():
    """Initialize all database schemas."""
    Base.metadata.create_all(users_engine)
    ConfigBase.metadata.create_all(config_engine)


# Initialize on import
init_all_databases()
