-- 005_download_count.sql
-- Track download counts per artifact.

ALTER TABLE artifacts
    ADD COLUMN IF NOT EXISTS download_count
    BIGINT NOT NULL DEFAULT 0;
