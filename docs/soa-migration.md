# SmartCampus Service Architecture (Current State)

This document describes the architecture that is currently implemented in this repository.

## Architecture summary

The backend is deployed as multiple Spring Boot services behind an API Gateway.

- `api-gateway` (`8080`): public entrypoint for `/api/**`
- `identity-service` (`8081`): authentication and user management
- `ticket-service` (`8082`): ticketing and ticket comments
- `department-service` (`8083`): department/support category catalog

MySQL runs as a shared engine with separate schemas per service:

- `smartcampus_identity`
- `smartcampus_ticket`
- `smartcampus_department`

## Service boundaries and ownership

1. Identity Service
- Owns:
  - `users`
  - `auth_sessions`
- Endpoints:
  - `/api/auth/*`
  - `/api/users/*`
- Responsibilities:
  - login/logout/current-user lookup
  - role-based user management
  - session-token lifecycle

2. Ticket Service
- Owns:
  - `tickets`
  - `comments`
- Endpoints:
  - `/api/tickets/*`
- Responsibilities:
  - ticket submission and retrieval
  - assignment/status updates
  - comment history and summary counters
- Integration:
  - validates department/category against Department Service
  - uses gateway-enriched identity headers for protected endpoints

3. Department Service
- Owns:
  - `departments`
- Endpoints:
  - `/api/departments/*`
- Responsibilities:
  - support category/department CRUD
  - routing metadata (service label, default location, response target)

4. API Gateway
- Owns:
  - edge routing and request forwarding
  - CORS handling for `/api/**`
  - identity enrichment for protected downstream calls
- Routing:
  - `/api/auth/*`, `/api/users/*` -> Identity Service
  - `/api/tickets/*` -> Ticket Service
  - `/api/departments/*` -> Department Service

## Authentication and authorization flow

Current implementation is session-token based (not JWT):

1. Client logs in via `POST /api/auth/login`.
2. Identity Service returns an opaque bearer token.
3. Protected requests go through API Gateway.
4. Gateway calls `GET /api/auth/me` on Identity Service using the bearer token.
5. Gateway injects:
   - `X-User-Id`
   - `X-Username`
   - `X-Email`
   - `X-Role`
6. Gateway also injects `X-Internal-Gateway-Key` for internal-service trust.
7. Downstream service interceptors validate shared key and user headers, then enforce role rules.

Public route exceptions:

- `POST /api/tickets` is allowed without authentication.
- `GET /api/departments/**` is publicly readable.

## Data and integration decisions (as implemented)

1. Database-per-service schema
- Each service reads/writes only its own schema.
- Cross-service joins/foreign keys are avoided.

2. Synchronous service-to-service communication
- API Gateway -> Identity Service for auth enrichment.
- Ticket Service -> Department Service for category validation.

3. Coarse-grained role control
- Roles include `ADMIN`, `STAFF`, `ASSIGNEE`, `SECURITY`.
- Each service applies role checks in its controller layer.

## Migration status

The service split described in earlier migration planning has already been executed in this repo.
Legacy "monolith current state" notes are no longer accurate for the runtime setup.

## Known technical gaps / future improvements

1. Move from opaque session tokens to signed JWT for local validation in services.
2. Replace string-based assignee (`ticket.assignee` username) with stable user-id linkage.
3. Add distributed tracing/correlation-id propagation and standardized structured logs.
4. Harden gateway and service security policy (rate limits, stricter origin policy, stronger internal auth).
