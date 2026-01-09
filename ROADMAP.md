# Roadmap: Good Package Repo

This roadmap outlines near-term hardening, medium-term feature work, and longer-term evolution for Good Package Repo.

## 0. Immediate Hardening (Security, Correctness, UX)

- Auth UX
  - Enforce login gating across all privileged actions (Publish, Account, Admin)
  - Consistent token storage and refresh strategy; clear errors for 401/403
- Backend auth defaults
  - Require JWT for read and write by default; allow opt-in anonymous read via ALLOW_ANON_READ
  - Add rate-limiting to /auth/login and basic password policy requirements
  - Validate JWT iss/aud (optional), shorter expiry, clock skew handling
- Data integrity
  - Use atomic CAS for artifact metadata creation to avoid publish races
  - Respect DB-configured BlobStore.root and path_template
  - Semver-aware sorting for "latest" resolution
- Observability & ops
  - Protect /rocksdb/* endpoints behind admin scope
  - Add structured logging with request IDs and error codes
  - Health endpoints with dependency checks (DB, RocksDB, disk space)

## 1. Persistence & Performance

- Index persistence
  - Persist index entries in RocksDB (or rebuild on startup from KV prefix scan)
  - Add pagination to list endpoints
- Config access performance
  - Cache get_repository_config with TTL; invalidate on admin writes
- RocksDB iteration
  - Replace full iteration for stats with sampled/approximate metrics
  - Optional background counters updated on put/delete

## 2. Production Readiness

- Server hardening
  - Run backend with gunicorn (multiple workers, timeouts)
  - Run as non-root; add Docker HEALTHCHECK
- CORS & headers
  - Restrict CORS origins in production; secure response headers
- Build & dependencies
  - Align Flask/Werkzeug compatible versions; pin with constraints file

## 3. API Features & Schema Alignment

- Validation & normalization
  - Centralize normalization/validation (single source shared by operations and Flask routes)
- Tags & mutability
  - Enforce feature flags (mutable_tags, overwrite policy) at write-time
- Proxy/upstreams
  - Implement proxy.fetch with configurable upstreams, timeouts, retries
- GC & replication
  - Implement GC sweep scheduling and retention policies
  - Event log persistence and replication shipping (batching/dedupe)

## 4. Frontend Enhancements

- Pages & flows
  - Complete Browse, Docs, Account, Admin flows (list versions/tags, latest resolution)
  - Login flow: remember me, logout confirmation, password change UI
- API integration
  - Central API client with auth interceptors and error handling
  - Robust upload UI: progress, retry, digest verification feedback
- Admin console (MVP)
  - View config/entities/routes/blob stores
  - Rotate JWT secret and user management (admin-only)

## 5. Testing & Quality

- Unit tests
  - Backend: routes, auth, CAS semantics, semver latest
  - Operations executor: behavior coverage (kv, blob, index, respond, auth)
- E2E tests
  - Start backend in test compose or mock API responses (MSW) for stable CI runs
  - Auth flows (login, publish success/failure), browse, docs
- CI improvements
  - Parallel jobs for lint/test/build; artifacts for test reports
  - Dependabot/security scanning policy with auto PRs

## 6. Observability & SRE

- Metrics
  - Basic Prometheus metrics (request counts/latency, errors, blob ops)
- Tracing
  - Optional OpenTelemetry instrumentation (HTTP handlers, RocksDB operations)
- Alerts
  - Healthcheck/uptime probe; error rate alerting

## 7. Documentation

- Security model
  - Anonymous vs authenticated access; ALLOW_ANON_READ guidance
  - JWT secret management; rotation procedure
- Deployment
  - Production-ready compose/k8s examples; CapRover instructions
- API reference
  - Auth, package endpoints, error schemas, examples

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
