import styles from './page.module.scss';

export default function DocsPage() {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Documentation</h1>
        <p>Complete guide to using Good Package Repo</p>
      </div>

      <div className={styles.toc}>
        <h2>Table of Contents</h2>
        <ul>
          <li><a href="#getting-started">Getting Started</a></li>
          <li><a href="#caprover-setup">CapRover Setup</a></li>
          <li><a href="#api-usage">API Usage</a></li>
          <li><a href="#schema">Schema Configuration</a></li>
        </ul>
      </div>

      <div className={styles.content}>
        <h2 id="getting-started">Getting Started</h2>
        <p>
          Good Package Repo is a schema-driven package repository that provides secure,
          fast, and reliable artifact storage. It implements a declarative configuration
          model based on the included <code>schema.json</code> file.
        </p>

        <h3>Quick Start with Docker</h3>
        <pre><code>{`# Clone the repository
git clone https://github.com/johndoe6345789/goodpackagerepo.git
cd goodpackagerepo

# Start with Docker Compose
docker-compose up -d

# The frontend will be available at http://localhost:3000
# The backend API will be available at http://localhost:5000`}</code></pre>

        <h2 id="caprover-setup">CapRover Setup</h2>
        <p>
          CapRover is a free and open-source PaaS that makes deployment incredibly simple.
          Here's how to deploy Good Package Repo on CapRover:
        </p>

        <h3>Prerequisites</h3>
        <ul>
          <li>A CapRover instance running (see <a href="https://caprover.com/docs/get-started.html" target="_blank">CapRover installation guide</a>)</li>
          <li>CapRover CLI installed: <code>npm install -g caprover</code></li>
          <li>GitHub Container Registry (GHCR) access (optional, for pre-built images)</li>
        </ul>

        <h3>Step 1: Create Backend App</h3>
        <ol>
          <li>Log into your CapRover dashboard</li>
          <li>Click on "Apps" in the sidebar</li>
          <li>Click "One-Click Apps/Databases"</li>
          <li>Scroll down and click "Create a New App"</li>
          <li>Enter app name: <code>goodrepo-backend</code></li>
          <li>Check "Has Persistent Data"</li>
        </ol>

        <h3>Step 2: Configure Backend</h3>
        <ol>
          <li>Go to the app's "Deployment" tab</li>
          <li>Select "Method 3: Deploy from Github/Bitbucket/Gitlab"</li>
          <li>Enter repository: <code>johndoe6345789/goodpackagerepo</code></li>
          <li>Branch: <code>main</code></li>
          <li>Captain Definition File: <code>backend/captain-definition</code></li>
          <li>Click "Save & Update"</li>
        </ol>

        <h3>Step 3: Set Environment Variables</h3>
        <p>In the "App Configs" tab, add these environment variables:</p>
        <ul>
          <li><code>DATA_DIR</code> = <code>/data</code></li>
        </ul>

        <h3>Step 4: Create Frontend App</h3>
        <ol>
          <li>Create another app: <code>goodrepo-frontend</code></li>
          <li>Follow the same deployment process</li>
          <li>Captain Definition File: <code>frontend/captain-definition</code></li>
          <li>Set environment variable: <code>NEXT_PUBLIC_API_URL</code> = <code>https://goodrepo-backend.your-domain.com</code></li>
        </ol>

        <h3>Step 5: Enable HTTPS</h3>
        <ol>
          <li>Go to each app's "HTTP Settings"</li>
          <li>Check "Enable HTTPS"</li>
          <li>Check "Force HTTPS"</li>
          <li>Save changes</li>
        </ol>

        <p>
          That's it! Your Good Package Repo is now deployed and accessible at your CapRover domain.
        </p>

        <h2 id="api-usage">API Usage</h2>
        
        <h3>Authentication</h3>
        <p>
          Most endpoints require an auth token for authentication. Include it in the Authorization header:
        </p>
        <pre><code>{`Authorization: Bearer YOUR_TOKEN`}</code></pre>

        <h3>Publishing a Package</h3>
        <pre><code>{`curl -X PUT \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/octet-stream" \\
  --data-binary @package.tar.gz \\
  https://your-repo.com/v1/acme/myapp/1.0.0/linux-amd64/blob`}</code></pre>

        <h3>Downloading a Package</h3>
        <pre><code>{`curl -H "Authorization: Bearer YOUR_TOKEN" \\
  https://your-repo.com/v1/acme/myapp/1.0.0/linux-amd64/blob \\
  -o myapp.tar.gz`}</code></pre>

        <h3>Getting Latest Version</h3>
        <pre><code>{`curl -H "Authorization: Bearer YOUR_TOKEN" \\
  https://your-repo.com/v1/acme/myapp/latest`}</code></pre>

        <h3>Listing Versions</h3>
        <pre><code>{`curl -H "Authorization: Bearer YOUR_TOKEN" \\
  https://your-repo.com/v1/acme/myapp/versions`}</code></pre>

        <h3>Setting a Tag</h3>
        <pre><code>{`curl -X PUT \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"target_version": "1.0.0", "target_variant": "linux-amd64"}' \\
  https://your-repo.com/v1/acme/myapp/tags/stable`}</code></pre>

        <h2 id="schema">Schema Configuration</h2>
        <p>
          Good Package Repo uses a declarative JSON schema to define its behavior. The schema includes:
        </p>
        <ul>
          <li><strong>Entities</strong>: Data models with validation and normalization rules</li>
          <li><strong>Storage</strong>: Blob stores, KV stores, and document schemas</li>
          <li><strong>Indexes</strong>: Optimized queries for package lookup</li>
          <li><strong>Auth</strong>: Scope-based authentication and permissions</li>
          <li><strong>API Routes</strong>: Declarative pipeline-based endpoints</li>
          <li><strong>Caching</strong>: Response and blob caching policies</li>
          <li><strong>Replication</strong>: Event sourcing for multi-region sync</li>
          <li><strong>GC</strong>: Automatic garbage collection for unreferenced blobs</li>
        </ul>

        <p>
          The schema ensures consistency, security, and performance across all operations.
          All modifications are validated at load-time to prevent misconfigurations.
        </p>
      </div>
    </div>
  );
}
