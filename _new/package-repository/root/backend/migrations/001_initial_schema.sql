-- 001_initial_schema.sql
-- Abstract package repository schema.
-- Supports arbitrary entity types via the repo_types table.

CREATE TABLE IF NOT EXISTS users (
    id          SERIAL PRIMARY KEY,
    username    TEXT UNIQUE NOT NULL,
    pass_hash   TEXT NOT NULL,
    pass_salt   TEXT NOT NULL,
    scopes      TEXT NOT NULL DEFAULT 'read',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed default admin (password: admin)
-- Hash is computed at app startup if row missing.

CREATE TABLE IF NOT EXISTS repo_types (
    id          SERIAL PRIMARY KEY,
    name        TEXT UNIQUE NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    schema_json JSONB NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS entity_defs (
    id          SERIAL PRIMARY KEY,
    repo_type   INTEGER REFERENCES repo_types(id),
    name        TEXT NOT NULL,
    fields      JSONB NOT NULL DEFAULT '[]',
    constraints JSONB NOT NULL DEFAULT '[]',
    primary_key JSONB NOT NULL DEFAULT '[]',
    UNIQUE (repo_type, name)
);

CREATE TABLE IF NOT EXISTS artifacts (
    id          BIGSERIAL PRIMARY KEY,
    repo_type   INTEGER REFERENCES repo_types(id),
    namespace   TEXT NOT NULL,
    name        TEXT NOT NULL,
    version     TEXT NOT NULL,
    variant     TEXT NOT NULL DEFAULT 'default',
    blob_digest TEXT NOT NULL,
    blob_size   BIGINT NOT NULL DEFAULT 0,
    labels      JSONB NOT NULL DEFAULT '{}',
    created_by  TEXT NOT NULL DEFAULT 'unknown',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (repo_type, namespace, name, version, variant)
);

CREATE INDEX idx_artifacts_ns_name
    ON artifacts (repo_type, namespace, name);
CREATE INDEX idx_artifacts_version
    ON artifacts (repo_type, namespace, name, version DESC);
