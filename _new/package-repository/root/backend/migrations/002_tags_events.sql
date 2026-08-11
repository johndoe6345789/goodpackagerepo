-- 002_tags_events.sql
-- Tags, events, and configuration tables.

CREATE TABLE IF NOT EXISTS tags (
    id          BIGSERIAL PRIMARY KEY,
    repo_type   INTEGER REFERENCES repo_types(id),
    namespace   TEXT NOT NULL,
    name        TEXT NOT NULL,
    tag         TEXT NOT NULL,
    target_id   BIGINT REFERENCES artifacts(id),
    updated_by  TEXT NOT NULL DEFAULT 'unknown',
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (repo_type, namespace, name, tag)
);

CREATE TABLE IF NOT EXISTS events (
    id          BIGSERIAL PRIMARY KEY,
    repo_type   INTEGER REFERENCES repo_types(id),
    event_type  TEXT NOT NULL,
    payload     JSONB NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_events_type
    ON events (event_type, created_at DESC);

CREATE TABLE IF NOT EXISTS route_defs (
    id          SERIAL PRIMARY KEY,
    repo_type   INTEGER REFERENCES repo_types(id),
    route_id    TEXT NOT NULL,
    method      TEXT NOT NULL,
    path        TEXT NOT NULL,
    tags        JSONB NOT NULL DEFAULT '[]',
    pipeline    JSONB NOT NULL DEFAULT '[]',
    UNIQUE (repo_type, route_id)
);

CREATE TABLE IF NOT EXISTS auth_scopes (
    id          SERIAL PRIMARY KEY,
    name        TEXT UNIQUE NOT NULL,
    actions     JSONB NOT NULL DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS blob_stores (
    id          SERIAL PRIMARY KEY,
    name        TEXT UNIQUE NOT NULL,
    kind        TEXT NOT NULL DEFAULT 'filesystem',
    config      JSONB NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS features (
    id          SERIAL PRIMARY KEY,
    key         TEXT UNIQUE NOT NULL,
    value       JSONB NOT NULL DEFAULT 'false'
);
