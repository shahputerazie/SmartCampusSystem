# API Quick Reference

## Base URL

```
http://localhost:8082/api/ticketing
```

## Endpoints Summary

| Method | Endpoint               | Purpose                                     | Status Code                              |
| ------ | ---------------------- | ------------------------------------------- | ---------------------------------------- |
| POST   | `/tickets`             | Create a new ticket                         | 201 Created                              |
| GET    | `/tickets`             | Get all tickets (optional filter by status) | 200 OK                                   |
| GET    | `/tickets/{id}`        | Get a specific ticket                       | 200 OK / 404 Not Found                   |
| PUT    | `/tickets/{id}/status` | Update ticket status                        | 200 OK / 400 Bad Request / 404 Not Found |
| GET    | `/tickets/health`      | Service health check                        | 200 OK                                   |

## Status Values

- `PENDING` - Newly reported, awaiting assignment
- `IN_PROGRESS` - Technician actively working
- `RESOLVED` - Issue fixed (terminal state)

## Valid State Transitions

```
PENDING ──→ IN_PROGRESS ──→ RESOLVED
```

## Example Requests

### Create Ticket

```bash
curl -X POST http://localhost:8082/api/ticketing/tickets \
  -H "Content-Type: application/json" \
  -d '{
    "reportedByUserId": 101,
    "location": "Building A, Room 105",
    "issueDescription": "Projector not working"
  }'
```

### Get All Tickets

```bash
curl http://localhost:8082/api/ticketing/tickets
```

### Get PENDING Tickets Only

```bash
curl http://localhost:8082/api/ticketing/tickets?status=PENDING
```

### Get Specific Ticket

```bash
curl http://localhost:8082/api/ticketing/tickets/1
```

### Update Status

```bash
curl -X PUT http://localhost:8082/api/ticketing/tickets/1/status \
  -H "Content-Type: application/json" \
  -d '{"status": "IN_PROGRESS"}'
```

### Health Check

```bash
curl http://localhost:8082/api/ticketing/tickets/health
```
