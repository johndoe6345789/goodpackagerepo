import { getDisplayApiUrl } from '../utils/api';

/**
 * Getting Started documentation section.
 * @returns The getting started docs JSX.
 */
export default function DocsGettingStarted() {
  const api = getDisplayApiUrl();

  return (
    <>
      <h2 id="getting-started">Getting Started</h2>
      <p>
        This is a schema-driven package repository with
        secure, content-addressed artifact storage backed
        by PostgreSQL and a C++ Drogon backend.
      </p>

      <h3>Quick Start</h3>
      <pre><code>{`# Build and start with the manager CLI
./manager repo build
./manager repo up

# Or use Docker Compose directly
cd tools/packagerepo
docker compose up -d

# Frontend:  http://localhost:3000
# Backend:   ${api}
# Endpoints: /health, /v1/*, /admin/*`}</code></pre>

      <h3>Manager Commands</h3>
      <pre><code>{`./manager repo build   # Build backend image
./manager repo up      # Start stack (DB + backend)
./manager repo down    # Stop stack
./manager repo status  # Show container status
./manager repo logs    # Tail backend logs`}</code></pre>
    </>
  );
}
