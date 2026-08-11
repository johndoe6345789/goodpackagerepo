-- 006_protocol_adapters.sql
-- Declarative protocol adapter config per repo type.
-- One row per native package manager protocol.

CREATE TABLE IF NOT EXISTS protocol_adapters (
    id            SERIAL PRIMARY KEY,
    repo_type     INTEGER REFERENCES repo_types(id),
    name          TEXT NOT NULL,
    prefix        TEXT NOT NULL,
    namespace     TEXT NOT NULL,
    content_type  TEXT NOT NULL DEFAULT 'application/octet-stream',
    tarball_ext   TEXT NOT NULL DEFAULT '.bin',
    meta_format   TEXT NOT NULL DEFAULT '',
    enabled       BOOLEAN NOT NULL DEFAULT true,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (repo_type, name)
);

-- Seed all 15 adapters for the default generic repo type.
INSERT INTO protocol_adapters
    (repo_type, name, prefix, namespace,
     content_type, tarball_ext, meta_format)
SELECT rt.id, v.name, v.prefix, v.namespace,
       v.content_type, v.tarball_ext, v.meta_format
FROM repo_types rt,
(VALUES
  ('npm','/npm','npm','application/octet-stream','.tgz','npm-registry-v1'),
  ('apt','/apt','apt','application/vnd.debian.binary-package','.deb','apt-packages'),
  ('conan','/conan','conan','application/gzip','.tgz','conan-v2'),
  ('pypi','/pypi','pypi','application/octet-stream','.whl','pypi-simple'),
  ('maven','/maven','maven','application/java-archive','.jar','maven-repo'),
  ('nuget','/nuget','nuget','application/octet-stream','.nupkg','nuget-v3'),
  ('cargo','/cargo','cargo','application/octet-stream','.crate','cargo-sparse'),
  ('go','/go','go','application/zip','.zip','go-proxy'),
  ('rpm','/rpm','rpm','application/x-rpm','.rpm','yum-repo'),
  ('alpine','/alpine','alpine','application/octet-stream','.apk','apk-index'),
  ('helm','/helm','helm','application/gzip','.tgz','helm-repo'),
  ('oci','/v2','docker','application/vnd.oci.image.manifest.v1+json','','oci-dist'),
  ('rubygems','/rubygems','rubygems','application/octet-stream','.gem','rubygems-api'),
  ('composer','/composer','composer','application/zip','.zip','composer-v2'),
  ('generic','/v1','generic','application/octet-stream','.bin','rest-v1')
) AS v(name, prefix, namespace, content_type, tarball_ext, meta_format)
WHERE rt.name = 'generic'
ON CONFLICT (repo_type, name) DO NOTHING;
