import { getDisplayApiUrl } from '../utils/api';

/**
 * API Usage documentation section.
 * @returns The API usage docs JSX.
 */
export default function DocsApiUsage() {
  const api = getDisplayApiUrl();

  return (
    <>
      <h2 id="api-usage">API Usage</h2>

      <h3>Authentication</h3>
      <p>
        Most endpoints require a Bearer token. Get one
        via the login endpoint:
      </p>
      <pre><code>{`curl -X POST ${api}/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"username":"admin","password":"admin"}'

# Response: { "token": "...", "user": {...} }
# Use token in subsequent requests:
Authorization: Bearer YOUR_TOKEN`}</code></pre>

      <h3>Publishing a Package</h3>
      <pre><code>{`curl -X PUT \\
  -H "Authorization: Bearer $TOKEN" \\
  --data-binary @package.tar.gz \\
  ${api}/v1/acme/myapp/1.0.0/linux-amd64/blob`}</code></pre>

      <h3>Downloading a Package</h3>
      <pre><code>{`curl -H "Authorization: Bearer $TOKEN" \\
  ${api}/v1/acme/myapp/1.0.0/linux-amd64/blob \\
  -o myapp.tar.gz`}</code></pre>

      <h3>Getting Latest Version</h3>
      <pre><code>{`curl -H "Authorization: Bearer $TOKEN" \\
  ${api}/v1/acme/myapp/latest`}</code></pre>

      <h3>Listing Versions</h3>
      <pre><code>{`curl -H "Authorization: Bearer $TOKEN" \\
  ${api}/v1/acme/myapp/versions`}</code></pre>

      <h3>Browse All Packages</h3>
      <pre><code>{`curl ${api}/v1/packages`}</code></pre>

      <h3>Setting a Tag</h3>
      <pre><code>{`curl -X PUT \\
  -H "Authorization: Bearer $TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"target_version":"1.0.0",\
"target_variant":"linux-amd64"}' \\
  ${api}/v1/acme/myapp/tags/stable`}</code></pre>
    </>
  );
}
