# Roadmap: Good Package Repo

This roadmap outlines near-term hardening, medium-term feature work, and longer-term evolution for Good Package Repo.

## Functional Requirements Status

### ✅ Implemented
- Seed data ingestion and sample packages for demo/test scenarios
- Reusable templates for entities, routes, pipelines, blob stores, auth scopes, and upstreams
- Operation vocabulary executor with auth, parsing, validation, transactions, KV, blob, index, cache, proxy placeholder, responses, and events
- SQLAlchemy-backed configuration and auth data models with session-based auth and JWT issuing
- Validation/test coverage for operation semantics and schema compliance
- Documentation for operations, templates, and seed data usage

### 🔧 Still Needed
- Production-grade storage backends (RocksDB/Redis) and index persistence
- Full proxy.fetch upstream implementation with retries and timeouts
- Admin user management (rotate JWT secret, manage users/scopes)
- Robust upload UX (progress, retry, digest verification feedback)
- Observability hardening (structured logging, protected admin endpoints, tracing)
- Security hardening (rate limiting, JWT validation options, password policy)

## 0. Immediate Hardening (Security, Correctness, UX)

- Auth UX
  - [x] Enforce login gating across all privileged actions (Publish, Account, Admin)
  - [x] Consistent token storage and refresh strategy; clear errors for 401/403
- Backend auth defaults
  - [x] Require JWT for read and write by default; allow opt-in anonymous read via ALLOW_ANON_READ
  - [ ] Add rate-limiting to /auth/login and basic password policy requirements
  - [ ] Validate JWT iss/aud (optional), shorter expiry, clock skew handling
- Data integrity
  - [ ] Use atomic CAS for artifact metadata creation to avoid publish races
  - [x] Respect DB-configured BlobStore.root and path_template
  - [ ] Semver-aware sorting for "latest" resolution
- Observability & ops
  - [ ] Protect /rocksdb/* endpoints behind admin scope
  - [ ] Add structured logging with request IDs and error codes
  - [x] Health endpoints with dependency checks (DB, RocksDB, disk space)

## 1. Persistence & Performance

- Index persistence
  - [ ] Persist index entries in RocksDB (or rebuild on startup from KV prefix scan)
  - [ ] Add pagination to list endpoints
- Config access performance
  - [ ] Cache get_repository_config with TTL; invalidate on admin writes
- RocksDB iteration
  - [x] Replace full iteration for stats with sampled/approximate metrics
  - [ ] Optional background counters updated on put/delete

## 2. Production Readiness

- Server hardening
  - [ ] Run backend with gunicorn (multiple workers, timeouts)
  - [x] Run as non-root; add Docker HEALTHCHECK
- CORS & headers
  - [x] Restrict CORS origins in production; secure response headers
- Build & dependencies
  - [x] Align Flask/Werkzeug compatible versions; pin with constraints file

## 3. API Features & Schema Alignment

- Validation & normalization
  - [x] Centralize normalization/validation (single source shared by operations and Flask routes)
- Tags & mutability
  - [ ] Enforce feature flags (mutable_tags, overwrite policy) at write-time
- Proxy/upstreams
  - [ ] Implement proxy.fetch with configurable upstreams, timeouts, retries
- GC & replication
  - [ ] Implement GC sweep scheduling and retention policies
  - [ ] Event log persistence and replication shipping (batching/dedupe)

## 4. Frontend Enhancements

- Pages & flows
  - [x] Complete Browse, Docs, Account, Admin flows (list versions/tags, latest resolution)
  - [x] Login flow: remember me, logout confirmation, password change UI
- API integration
  - [x] Central API client with auth interceptors and error handling
  - [ ] Robust upload UI: progress, retry, digest verification feedback
- Admin console (MVP)
  - [x] View config/entities/routes/blob stores
  - [ ] Rotate JWT secret and user management (admin-only)

## 5. Testing & Quality

- Unit tests
  - [x] Backend: routes, auth, CAS semantics, semver latest
  - [x] Operations executor: behavior coverage (kv, blob, index, respond, auth)
- E2E tests
  - [x] Start backend in test compose or mock API responses (MSW) for stable CI runs
  - [x] Auth flows (login, publish success/failure), browse, docs
- CI improvements
  - [ ] Parallel jobs for lint/test/build; artifacts for test reports
  - [ ] Dependabot/security scanning policy with auto PRs

## 6. Observability & SRE

- Metrics
  - [x] Basic Prometheus metrics (request counts/latency, errors, blob ops)
- Tracing
  - [ ] Optional OpenTelemetry instrumentation (HTTP handlers, RocksDB operations)
- Alerts
  - [x] Healthcheck/uptime probe; error rate alerting

## 7. Documentation

- Security model
  - [x] Anonymous vs authenticated access; ALLOW_ANON_READ guidance
  - [ ] JWT secret management; rotation procedure
- Deployment
  - [x] Production-ready compose/k8s examples; CapRover instructions
- API reference
  - [x] Auth, package endpoints, error schemas, examples

---

## Milestones & Deliverables

- Milestone A: Secure Uploads & Reads (1–2 weeks)
  - Login gating across UI, CAS publish, semver latest, protect /rocksdb/*
  - Config caching and BlobStore path_template support
- Milestone B: Productionization (2–3 weeks)
  - Gunicorn, non-root, healthchecks, CORS tightening, logging/metrics
  - Index persistence or rebuild; pagination
- Milestone C: Admin & Proxy (2–3 weeks)
  - Admin UI for config inspection and user mgmt
  - Upstream proxy with timeouts/retries; feature flag enforcement
- Milestone D: Test & Docs (1–2 weeks)
  - Unit/E2E coverage, CI improvements, security/deployment docs

## Tracking

Use GitHub Projects or Issues with labels:
- area:backend, area:frontend, area:infra, area:security
- type:bug, type:feature, type:hardening
- priority:P0/P1/P2

Each deliverable should have:
- Definition of done (tests, docs, deployment notes)
- Rollback plan (config toggles, safe deploy)
- Owner and due date
