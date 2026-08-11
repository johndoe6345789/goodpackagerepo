# goodpackagerepo

World's first good package repository - A schema-driven, secure, and fast artifact storage system.

## Features

- 🔒 **Secure by Design**: Content-addressed storage with SHA256 verification
- ⚡ **Lightning Fast**: Built-in caching and intelligent indexing
- 📋 **Schema-Driven**: Declarative configuration with automatic validation
- 🔐 **Authentication**: Simple admin login with password management
- 🐳 **Docker Ready**: Full Docker and docker-compose support
- 📦 **GHCR Support**: Automated builds and publishing to GitHub Container Registry
- 🚀 **CapRover Ready**: Easy deployment with CapRover PaaS

## Quick Start

### Using Docker Compose

```bash
git clone https://github.com/johndoe6345789/goodpackagerepo.git
cd goodpackagerepo
docker-compose up -d
```

The frontend will be available at http://localhost:3000 and the backend API at http://localhost:5000.

**Default credentials**: `admin` / `admin` (change after first login!)

### Manual Setup

#### Backend (Flask)

```bash
cd backend
pip install -r requirements.txt
export DATA_DIR=/tmp/data
python app.py
```

#### Frontend (Next.js)

```bash
cd frontend
npm install
npm run dev
```

## Seed Data and Templates

### Load Example Data

To populate your repository with example packages for testing:

```bash
cd seed_data
pip install requests
python load_seed_data.py
```

This loads sample packages including:
- `acme/hello-world` - Multi-version example with multiple variants
- `example/webapp` - Web application containers
- `tools/cli-tool` - CLI tool example
- `libs/utility` - Library with prerelease versions

### Templates

The `templates/` directory contains reusable templates for:
- **Entity definitions** - Define new data models
- **API routes** - Create custom endpoints
- **Pipeline patterns** - Common operation sequences
- **Blob stores** - Configure storage backends
- **Auth scopes** - Define permission sets
- **Upstream proxies** - Configure external repositories

See `templates/README.md` for the complete operation vocabulary and usage examples.

## Documentation

Complete documentation is available at `/docs` when running the application, including:

- Getting Started Guide
- CapRover Deployment Instructions
- API Usage Examples
- Schema Configuration
- Operation Vocabulary Reference

## Testing

### E2E Tests (Playwright)

```bash
cd tests
npm install
npx playwright install
npm test
```

See `tests/README.md` for more testing options.

## Deployment

### CapRover

See the full CapRover setup guide in the documentation at `/docs#caprover-setup`.

Quick summary:
1. Create two apps in CapRover: `goodrepo-backend` and `goodrepo-frontend`
2. Deploy from GitHub using the respective `captain-definition` files
3. Set environment variables
4. Enable HTTPS

### Docker Registries

Images are automatically built and pushed to GitHub Container Registry (GHCR) on push to main:

- Backend: `ghcr.io/johndoe6345789/goodpackagerepo/backend:latest`
- Frontend: `ghcr.io/johndoe6345789/goodpackagerepo/frontend:latest`

## Architecture

- **Backend**: Flask-based Python API implementing the schema.json specification
- **Frontend**: Next.js/React application with custom Material Design SCSS
- **Storage**: SQLite for user auth, filesystem for blobs, in-memory for metadata
- **Authentication**: Admin login with bcrypt password hashing

## API Endpoints

### Authentication
- `POST /auth/login` - Login and get an auth token
- `POST /auth/change-password` - Change password
- `GET /auth/me` - Get current user info

### Package Management
- `PUT /v1/{namespace}/{name}/{version}/{variant}/blob` - Publish package
- `GET /v1/{namespace}/{name}/{version}/{variant}/blob` - Download package
- `GET /v1/{namespace}/{name}/latest` - Get latest version
- `GET /v1/{namespace}/{name}/versions` - List all versions
- `PUT /v1/{namespace}/{name}/tags/{tag}` - Set tag

### API Access

**Docker Compose**: Backend is on `http://localhost:5000`, frontend on `http://localhost:3000` proxies API requests automatically.

**Production Deployments**: Two options:
1. **Separate domains**: Set `NEXT_PUBLIC_API_URL` to backend URL (e.g., `https://api.example.com`)
2. **Single domain with proxy**: Set `NEXT_PUBLIC_API_URL=""` and `BACKEND_URL` to internal backend address. The frontend proxies `/auth/*`, `/v1/*`, `/admin/*`, `/health`, and `/schema` routes to the backend. Access all routes through the frontend domain (e.g., `https://repo.example.com/auth/login`)

## Schema Configuration

The repository behavior is defined by `schema.json`, which includes:

- **Entities**: Data models with validation rules
- **Storage**: Blob stores, KV stores, document schemas
- **Indexes**: Optimized package lookup
- **Auth**: Scope-based authentication and permissions
- **API Routes**: Declarative pipeline-based endpoints
- **Caching**: Response and blob caching policies
- **Replication**: Event sourcing for multi-region sync
- **GC**: Automatic garbage collection

## License

See LICENSE file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
