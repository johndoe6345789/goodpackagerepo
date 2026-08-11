-- 007_adapter_templates.sql
-- Add response template columns to protocol_adapters.
-- These templates drive procedural response generation
-- from a single generic controller — no per-protocol C++.

ALTER TABLE protocol_adapters
    ADD COLUMN IF NOT EXISTS meta_regex  TEXT NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS dl_regex    TEXT NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS meta_tpl    TEXT NOT NULL DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS entry_tpl   TEXT NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS entry_sep   TEXT NOT NULL DEFAULT E'\n',
    ADD COLUMN IF NOT EXISTS meta_ct     TEXT NOT NULL
                             DEFAULT 'application/json',
    ADD COLUMN IF NOT EXISTS is_index    BOOLEAN NOT NULL DEFAULT false;
