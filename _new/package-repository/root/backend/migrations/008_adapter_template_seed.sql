-- 008_adapter_template_seed.sql
-- Seed meta_route (Drogon path patterns), templates,
-- and content types for all 15 protocol adapters.
-- Download uses {prefix}/dl/{name}/{version} for all.

-- npm: npm registry v1 JSON
UPDATE protocol_adapters SET
  meta_regex = '/npm/{1}',
  meta_tpl   = '{"name":"{name}","dist-tags":{"latest":"{latest}"},"versions":{{ENTRIES}}}',
  entry_tpl  = '"{ver}":{"name":"{name}","version":"{ver}","dist":{"tarball":"{dl_url}","shasum":"{digest}"}}',
  entry_sep  = ',', meta_ct = 'application/json', is_index = false
WHERE name = 'npm';

-- pypi: PEP 503 Simple Repository HTML
UPDATE protocol_adapters SET
  meta_regex = '/pypi/simple/{1}',
  meta_tpl   = '<!DOCTYPE html><html><body><h1>{name}</h1>{ENTRIES}</body></html>',
  entry_tpl  = '<a href="{dl_url}#sha256={digest}">{name}-{ver}{ext}</a><br>',
  entry_sep  = E'\n', meta_ct = 'text/html', is_index = false
WHERE name = 'pypi';

-- cargo: crates.io compatible JSON
UPDATE protocol_adapters SET
  meta_regex = '/cargo/api/v1/crates/{1}',
  meta_tpl   = '{"crate":{"id":"{name}","name":"{name}","max_version":"{latest}"},"versions":[{ENTRIES}]}',
  entry_tpl  = '{"crate":"{name}","num":"{ver}","dl_path":"{dl_url}","checksum":"{digest}"}',
  entry_sep  = ',', meta_ct = 'application/json', is_index = false
WHERE name = 'cargo';

-- go: Go module proxy text list
UPDATE protocol_adapters SET
  meta_regex = '/go/{1}/@v/list',
  meta_tpl   = '{ENTRIES}',
  entry_tpl  = 'v{ver}',
  entry_sep  = E'\n', meta_ct = 'text/plain', is_index = false
WHERE name = 'go';

-- maven: Maven metadata XML
UPDATE protocol_adapters SET
  meta_regex = '/maven/{1}/{2}/maven-metadata.xml',
  meta_tpl   = '<?xml version="1.0"?><metadata><artifactId>{name}</artifactId><versioning><latest>{latest}</latest><versions>{ENTRIES}</versions></versioning></metadata>',
  entry_tpl  = '<version>{ver}</version>',
  entry_sep  = '', meta_ct = 'application/xml', is_index = false
WHERE name = 'maven';

-- nuget: NuGet v3 registration JSON
UPDATE protocol_adapters SET
  meta_regex = '/nuget/v3/registration/{1}/index.json',
  meta_tpl   = '{"items":[{"items":[{ENTRIES}]}]}',
  entry_tpl  = '{"catalogEntry":{"id":"{name}","version":"{ver}"},"packageContent":"{dl_url}"}',
  entry_sep  = ',', meta_ct = 'application/json', is_index = false
WHERE name = 'nuget';

-- conan: Conan v2 revisions JSON
UPDATE protocol_adapters SET
  meta_regex = '/conan/v2/conans/{1}/{2}/_/_/revisions',
  meta_tpl   = '{"revisions":[{ENTRIES}]}',
  entry_tpl  = '{"revision":"{digest12}","time":"2026-01-01T00:00:00Z"}',
  entry_sep  = ',', meta_ct = 'application/json', is_index = false
WHERE name = 'conan';

-- oci: OCI Distribution tag list
UPDATE protocol_adapters SET
  meta_regex = '/v2/{1}/tags/list',
  meta_tpl   = '{"name":"{name}","tags":[{ENTRIES}]}',
  entry_tpl  = '"{ver}"',
  entry_sep  = ',', meta_ct = 'application/json', is_index = false
WHERE name = 'oci';

-- rubygems: RubyGems API JSON
UPDATE protocol_adapters SET
  meta_regex = '/rubygems/api/v1/gems/{1}.json',
  meta_tpl   = '{"name":"{name}","version":"{latest}","versions":[{ENTRIES}]}',
  entry_tpl  = '{"number":"{ver}","sha":"{digest}","platform":"ruby"}',
  entry_sep  = ',', meta_ct = 'application/json', is_index = false
WHERE name = 'rubygems';

-- composer: Composer packages.json
UPDATE protocol_adapters SET
  meta_regex = '/composer/packages.json',
  meta_tpl   = '{"packages":{{ENTRIES}}}',
  entry_tpl  = '"{ns}/{name}":[{"version":"{ver}","dist":{"url":"{dl_url}","type":"zip"}}]',
  entry_sep  = ',', meta_ct = 'application/json', is_index = true
WHERE name = 'composer';

-- generic: REST v1 JSON
UPDATE protocol_adapters SET
  meta_regex = '/v1/{1}',
  meta_tpl   = '{"name":"{name}","latest":"{latest}","versions":[{ENTRIES}]}',
  entry_tpl  = '{"version":"{ver}","digest":"{digest}","size":{size},"url":"{dl_url}"}',
  entry_sep  = ',', meta_ct = 'application/json', is_index = false
WHERE name = 'generic';

-- apt: Debian Packages index (index type)
UPDATE protocol_adapters SET
  meta_regex = '/apt/dists/{1}/main/binary-{2}/Packages',
  meta_tpl   = '{ENTRIES}',
  entry_tpl  = E'Package: {name}\nVersion: {ver}\nArchitecture: amd64\nFilename: {dl_url}\nSize: {size}\nSHA256: {digest}\nDescription: {name} {ver}\n',
  entry_sep  = E'\n', meta_ct = 'text/plain', is_index = true
WHERE name = 'apt';

-- rpm: Yum repodata XML (index type)
UPDATE protocol_adapters SET
  meta_regex = '/rpm/repodata/primary.xml',
  meta_tpl   = '<?xml version="1.0"?><metadata>{ENTRIES}</metadata>',
  entry_tpl  = '<package type="rpm"><name>{name}</name><version ver="{ver}"/><location href="{dl_url}"/><size package="{size}"/><checksum type="sha256">{digest}</checksum></package>',
  entry_sep  = '', meta_ct = 'application/xml', is_index = true
WHERE name = 'rpm';

-- alpine: APKINDEX text (index type)
UPDATE protocol_adapters SET
  meta_regex = '/alpine/{1}/{2}/APKINDEX',
  meta_tpl   = '{ENTRIES}',
  entry_tpl  = E'P:{name}\nV:{ver}\nS:{size}\nC:Q1{digest}\n',
  entry_sep  = E'\n', meta_ct = 'text/plain', is_index = true
WHERE name = 'alpine';

-- helm: Helm index.yaml (index type)
UPDATE protocol_adapters SET
  meta_regex = '/helm/index.yaml',
  meta_tpl   = E'apiVersion: v1\nentries:\n{ENTRIES}',
  entry_tpl  = E'  {name}:\n  - name: {name}\n    version: "{ver}"\n    urls:\n    - {dl_url}',
  entry_sep  = E'\n', meta_ct = 'text/yaml', is_index = true
WHERE name = 'helm';
