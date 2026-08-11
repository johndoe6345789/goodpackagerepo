-- 003_seed_data.sql
-- Seed default repo type, auth scopes, and features.

INSERT INTO repo_types (name, description)
VALUES ('generic', 'Universal artifact repository')
ON CONFLICT (name) DO NOTHING;

INSERT INTO auth_scopes (name, actions) VALUES
    ('read',  '["blob.get","kv.get","index.query"]'),
    ('write', '["blob.put","kv.put","index.upsert"]'),
    ('admin', '["*"]')
ON CONFLICT (name) DO NOTHING;

INSERT INTO blob_stores (name, kind, config) VALUES
    ('primary', 'filesystem', '{
        "root": "/data/blobs",
        "addressing": "content_addressed",
        "digest": "sha256",
        "max_blob_bytes": 2147483648
    }')
ON CONFLICT (name) DO NOTHING;

INSERT INTO features (key, value) VALUES
    ('mutable_tags', 'true'),
    ('allow_overwrite', 'false'),
    ('proxy_enabled', 'true')
ON CONFLICT (key) DO NOTHING;

INSERT INTO entity_defs (repo_type, name, fields, constraints,
                         primary_key)
SELECT rt.id, 'artifact',
    '[{"name":"namespace","type":"string","normalize":["trim","lower"]},
      {"name":"name","type":"string","normalize":["trim","lower"]},
      {"name":"version","type":"string","normalize":["trim"]},
      {"name":"variant","type":"string","optional":true}]',
    '[{"field":"namespace","regex":"^[a-z0-9][a-z0-9._-]{0,127}$"},
      {"field":"name","regex":"^[a-z0-9][a-z0-9._-]{0,127}$"},
      {"field":"version","regex":"^[A-Za-z0-9][A-Za-z0-9._+-]{0,127}$"}]',
    '["namespace","name","version","variant"]'
FROM repo_types rt WHERE rt.name = 'generic'
ON CONFLICT (repo_type, name) DO NOTHING;
