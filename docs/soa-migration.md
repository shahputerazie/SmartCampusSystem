# SmartCampus SOA Migration Plan

## Current state

The backend is currently a single Spring Boot deployable:

- `AuthController` handles login/session endpoints (`/api/auth/*`).
- `UserManagementController` handles user CRUD and role-based operations (`/api/users/*`).
- `TicketController` handles tickets, assignment, status, and comments (`/api/tickets/*`).
- `SupportCategoryController` handles departments (`/api/departments/*`).

This is a monolith with domain modules, not a service-oriented deployment.

## Target service boundaries

Use these boundaries to reduce coupling and keep ownership clear:

1. Identity Service
- Owns users, credentials, sessions/tokens, and role checks.
- Endpoints:
  - `/api/auth/*`
  - `/api/users/*`
- Data ownership:
  - `users`
  - `auth_sessions`

2. Ticket Service
- Owns tickets and ticket comments.
- Endpoints:
  - `/api/tickets/*`
- Data ownership:
  - `tickets`
  - `comments`
- Integration:
  - Reads user identity/role from token claims or identity introspection.
  - Stores assignee as `assigneeUserId` (future), not free-text username.

3. Department Service
- Owns department metadata.
- Endpoints:
  - `/api/departments/*`
- Data ownership:
  - `departments`

4. Lost & Found Service
- Owns lost item reports, found item registry, and claim verification workflow.
- Endpoints:
  - `/api/lost-found/*`
- Data ownership:
  - `lost_item_reports`
  - `found_item_records`
- Integration:
  - Triggers notification workflow when potential matches are detected.

5. API Gateway (edge)
- Single public entry point for frontend.
- Performs route dispatch:
  - `/api/auth`, `/api/users` -> Identity Service
  - `/api/tickets` -> Ticket Service
  - `/api/departments` -> Department Service
  - `/api/lost-found` -> Lost & Found Service
- Can centralize CORS, rate limits, and request tracing.

## Migration strategy (strangler pattern)

### Phase 1: Prepare contracts and routing

1. Freeze endpoint contracts currently used by frontend in `Frontend/src/App.jsx`.
2. Add gateway in front of monolith (all routes still point to monolith initially).
3. Keep frontend pointing to one base URL (`VITE_API_BASE_URL`) so service moves are transparent.

### Phase 2: Extract Department Service first

1. Move department model/repository/controller into a new Spring Boot app.
2. Give Department Service its own database schema.
3. Switch gateway route `/api/departments` from monolith to Department Service.
4. Keep old monolith endpoint temporarily disabled or read-only for safety.

Why first: low coupling and low auth complexity.

### Phase 3: Extract Ticket Service

1. Move ticket/comment domain into Ticket Service.
2. Replace direct in-process auth assumptions with:
   - JWT claims validation in Ticket Service, or
   - identity introspection call to Identity Service.
3. Route `/api/tickets` through gateway to Ticket Service.
4. Add idempotent ticket status/assignment update handling and service-level audit logs.

### Phase 4: Keep Identity in monolith, then isolate

1. Move `AuthController`, `UserManagementController`, auth security components into Identity Service.
2. Route `/api/auth` and `/api/users` to Identity Service.
3. Retire monolith app once all routes are cut over.

## Data and integration decisions

1. Database per service
- Each service owns its schema and write access.
- No cross-service foreign keys.

2. Identity propagation
- Prefer signed JWT access tokens with `sub`, `role`, `username`.
- Services validate signature and expiration locally.

3. Consistency
- Use synchronous APIs for command/query flows at first.
- Add event publishing later for cross-service projections if needed.

4. Observability baseline
- Correlation ID header from gateway to all services.
- Structured logs with service name and request ID.

## Minimal technical backlog

1. Create `identity-service`, `ticket-service`, and `department-service` Spring Boot projects.
2. Introduce API gateway config and local compose stack.
3. Move department domain first and verify no frontend changes required.
4. Move ticket domain and replace username-based assignee with stable user ID.
5. Move auth/user domain last and retire monolith.
