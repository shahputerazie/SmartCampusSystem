# SmartCampus Services Split

This directory contains extracted backend services from the original monolith:

- `api-gateway` (port `8080`): single entrypoint, routes all `/api/*`
- `identity-service` (port `8081`): `/api/auth/*`, `/api/users/*`
- `ticket-service` (port `8082`): `/api/tickets/*`
- `department-service` (port `8083`): `/api/departments/*`

## Run each service

```bash
cd services/identity-service && mvn spring-boot:run
cd services/ticket-service && mvn spring-boot:run
cd services/department-service && mvn spring-boot:run
cd services/api-gateway && mvn spring-boot:run
```

## Gateway routing

`api-gateway` routes by path:

- `/api/auth/*` and `/api/users/*` -> identity service
- `/api/tickets/*` -> ticket service
- `/api/departments/*` -> department service

For protected ticket/department routes, the gateway verifies `Authorization: Bearer ...` against identity service (`/api/auth/me`) and injects internal user headers automatically.

Public routes:

- `POST /api/auth/login`
- `POST /api/tickets`
- `GET /api/departments/**`
