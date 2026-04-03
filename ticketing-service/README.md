# Ticketing Service - SOA Smart Campus System

## Overview

This is a production-ready Spring Boot microservice implementing the **Ticketing Service** for the Smart Campus Support System. It demonstrates Service-Oriented Architecture (SOA) principles with strict layered architecture and state management.

## Architecture

### Layered Architecture

```
┌─────────────────────────────────────┐
│     REST API Layer (Controller)     │  HTTP Endpoints
├─────────────────────────────────────┤
│   Business Logic Layer (Service)    │  State transitions, validation
├─────────────────────────────────────┤
│  Data Access Layer (Repository)     │  JPA/Database queries
├─────────────────────────────────────┤
│   Data Representation (Entity)       │  JPA entities, domain objects
├─────────────────────────────────────┤
│     Persistence Layer (H2 DB)       │  In-memory database
└─────────────────────────────────────┘
```

### SOA Principles Implemented

1. **Service Independence**: Runs on Port 8082 with isolated H2 database
2. **Stateless Design**: All endpoints are stateless; no session data
3. **Separation of Concerns**: Each layer has a single responsibility
4. **RESTful API**: Standard HTTP verbs for CRUD operations
5. **State Management**: Ticket lifecycle with enforced transitions

## Project Structure

```
ticketing-service/
├── pom.xml                                    # Maven dependencies
├── src/main/
│   ├── java/com/smartcampus/ticketing/
│   │   ├── TicketingServiceApplication.java   # Spring Boot entry point
│   │   ├── entity/
│   │   │   ├── Ticket.java                    # Entity with JPA annotations
│   │   │   └── TicketStatus.java              # Status enum
│   │   ├── repository/
│   │   │   └── TicketRepository.java          # Data access interface
│   │   ├── service/
│   │   │   └── TicketService.java             # Business logic & state management
│   │   └── controller/
│   │       └── TicketController.java          # REST API endpoints
│   └── resources/
│       └── application.properties             # Configuration
```

## Technology Stack

- **Java**: JDK 17 (OpenJDK 17 or later)
- **Framework**: Spring Boot 3.2.0
- **ORM**: Spring Data JPA (Hibernate)
- **Database**: H2 (in-memory)
- **Build Tool**: Maven 3.6+
- **Port**: 8082 (configurable)

## Prerequisites

- Java 17 or later (verify: `java -version`)
- Maven 3.6 or later (verify: `mvn -version`)

## Installation & Building

### 1. Clone/Navigate to Project

```bash
cd /Users/shahputeraiskandar/Sites/SmartCampusSystem/ticketing-service
```

### 2. Build the Project

```bash
mvn clean package
```

This command:

- Cleans previous builds
- Compiles all Java classes
- Runs tests (if any)
- Packages into a JAR file at `target/ticketing-service-1.0.0.jar`

### 3. Run the Service

```bash
mvn spring-boot:run
```

Or run the JAR directly:

```bash
java -jar target/ticketing-service-1.0.0.jar
```

The service will start on `http://localhost:8082`

## Health Check

```bash
curl http://localhost:8082/api/ticketing/tickets/health
```

Expected Response:

```json
{
    "status": "UP",
    "service": "ticketing-service"
}
```

## REST API Endpoints

### 1. Create a Ticket (POST)

**Endpoint:** `POST /api/ticketing/tickets`

**Request Body:**

```json
{
    "reportedByUserId": 101,
    "location": "Building A, Room 105",
    "issueDescription": "Projector not turning on - tried power cycling, no response"
}
```

**Response:** `201 Created`

```json
{
    "id": 1,
    "reportedByUserId": 101,
    "location": "Building A, Room 105",
    "issueDescription": "Projector not turning on - tried power cycling, no response",
    "reportTime": "2026-04-03T10:30:45.123456",
    "status": "PENDING"
}
```

**Example with cURL:**

```bash
curl -X POST http://localhost:8082/api/ticketing/tickets \
  -H "Content-Type: application/json" \
  -d '{
    "reportedByUserId": 101,
    "location": "Building A, Room 105",
    "issueDescription": "Projector not turning on"
  }'
```

---

### 2. Get All Tickets (GET)

**Endpoint:** `GET /api/ticketing/tickets`

**Response:** `200 OK`

```json
[
    {
        "id": 1,
        "reportedByUserId": 101,
        "location": "Building A, Room 105",
        "issueDescription": "Projector not turning on",
        "reportTime": "2026-04-03T10:30:45.123456",
        "status": "PENDING"
    },
    {
        "id": 2,
        "reportedByUserId": 102,
        "location": "Library, Third Floor",
        "issueDescription": "Wi-Fi dead in conference room",
        "reportTime": "2026-04-03T10:35:12.654321",
        "status": "IN_PROGRESS"
    }
]
```

**Example with cURL:**

```bash
curl http://localhost:8082/api/ticketing/tickets
```

---

### 3. Get Tickets by Status (GET with Query)

**Endpoint:** `GET /api/ticketing/tickets?status=PENDING`

**Supported Statuses:**

- `PENDING`: Newly reported, not yet assigned
- `IN_PROGRESS`: Technician is actively working on the issue
- `RESOLVED`: Issue has been fixed

**Example:**

```bash
# Get all PENDING tickets
curl http://localhost:8082/api/ticketing/tickets?status=PENDING

# Get all IN_PROGRESS tickets
curl http://localhost:8082/api/ticketing/tickets?status=IN_PROGRESS

# Get all RESOLVED tickets
curl http://localhost:8082/api/ticketing/tickets?status=RESOLVED
```

---

### 4. Get a Single Ticket by ID (GET)

**Endpoint:** `GET /api/ticketing/tickets/{id}`

**Response:** `200 OK` (if exists) or `404 Not Found`

**Example:**

```bash
curl http://localhost:8082/api/ticketing/tickets/1
```

---

### 5. Update Ticket Status (PUT)

**Endpoint:** `PUT /api/ticketing/tickets/{id}/status`

**Request Body:**

```json
{
    "status": "IN_PROGRESS"
}
```

**Response:** `200 OK`

```json
{
    "id": 1,
    "reportedByUserId": 101,
    "location": "Building A, Room 105",
    "issueDescription": "Projector not turning on",
    "reportTime": "2026-04-03T10:30:45.123456",
    "status": "IN_PROGRESS"
}
```

**Valid State Transitions:**

```
PENDING ──→ IN_PROGRESS ──→ RESOLVED
           (only transition)  (terminal state)
```

**Invalid transitions return `400 Bad Request`:**

```bash
# Invalid: PENDING → RESOLVED (must go through IN_PROGRESS first)
curl -X PUT http://localhost:8082/api/ticketing/tickets/1/status \
  -H "Content-Type: application/json" \
  -d '{"status": "RESOLVED"}'
# Response: 400 Bad Request
# Error: "Invalid status transition: PENDING -> RESOLVED. Allowed transitions: PENDING->IN_PROGRESS, IN_PROGRESS->RESOLVED"
```

**Valid Example:**

```bash
# Step 1: Ticket is created as PENDING
# Step 2: Technician starts work
curl -X PUT http://localhost:8082/api/ticketing/tickets/1/status \
  -H "Content-Type: application/json" \
  -d '{"status": "IN_PROGRESS"}'

# Step 3: Technician finishes
curl -X PUT http://localhost:8082/api/ticketing/tickets/1/status \
  -H "Content-Type: application/json" \
  -d '{"status": "RESOLVED"}'
```

---

## Database Configuration

### H2 Console (for development/debugging)

**URL:** `http://localhost:8082/h2-console`

**Connection Details:**

- **JDBC URL:** `jdbc:h2:mem:ticketing_db`
- **Driver Class:** `org.h2.Driver`
- **User Name:** `sa`
- **Password:** (leave blank)

### Accessing H2 Console

1. Navigate to `http://localhost:8082/h2-console`
2. Click "Connect"
3. Run SQL queries directly:

```sql
-- View all tickets
SELECT * FROM tickets;

-- View tickets by status
SELECT * FROM tickets WHERE status = 'PENDING';

-- Count tickets by status
SELECT status, COUNT(*) FROM tickets GROUP BY status;
```

---

## State Management Specification

### Ticket Lifecycle

A ticket progresses through the following states:

```
1. PENDING
   Description: Issue has been reported but not yet assigned
   Transitions: Can only move to IN_PROGRESS
   Typical Duration: Immediately to assignment

2. IN_PROGRESS
   Description: Technician is actively working on the issue
   Transitions: Can only move to RESOLVED
   Typical Duration: Minutes to hours depending on complexity

3. RESOLVED
   Description: Issue has been fixed (TERMINAL STATE)
   Transitions: None (no further changes possible)
   Duration: Permanent
```

### State Transition Enforcement

- **Enforced by:** TicketService.isValidStatusTransition()
- **Prevents:** Invalid transitions (e.g., PENDING → RESOLVED)
- **Error Handling:** Throws IllegalArgumentException caught by Controller as 400 Bad Request

---

## Configuration Details

### application.properties Settings

```properties
# Server runs on port 8082 (unique to ticketing service)
server.port=8082

# Context path groups all endpoints under /api/ticketing
server.servlet.context-path=/api/ticketing

# H2 in-memory database configuration
spring.datasource.url=jdbc:h2:mem:ticketing_db;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=false

# Hibernate DDL strategy: create-drop resets DB on each startup (for development)
# For production, use 'validate' or 'update'
spring.jpa.hibernate.ddl-auto=create-drop

# Logging levels
spring.jpa.show-sql=false
spring.jpa.properties.hibernate.format_sql=true
```

---

## Code Quality & Academic Comments

### Why This Architecture?

#### 1. **Entity Layer (`entity/`)**

- **Why:** Separates domain objects from business logic
- **Benefit:** Changes to database schema don't affect Service/Controller layers
- **Implementation:** JPA annotations define persistence strategy

#### 2. **Repository Layer (`repository/`)**

- **Why:** Abstracts data access using DAO pattern
- **Benefit:** Swapping databases (H2 → PostgreSQL) only requires this layer change
- **Implementation:** Spring Data JPA auto-generates SQL queries

#### 3. **Service Layer (`service/`)**

- **Why:** Contains all business logic and state management
- **Benefit:** Reusable logic for multiple controllers; testable without HTTP
- **Implementation:** Enforces state transitions; validates operations

#### 4. **Controller Layer (`controller/`)**

- **Why:** Handles only HTTP concerns
- **Benefit:** Thin controllers reduce bugs; easy to test by mocking Service
- **Implementation:** Maps HTTP verbs to Service method calls

---

## Testing the Service

### Complete Workflow Test

```bash
# 1. Create a ticket
TICKET_ID=$(curl -s -X POST http://localhost:8082/api/ticketing/tickets \
  -H "Content-Type: application/json" \
  -d '{
    "reportedByUserId": 101,
    "location": "Building A, Room 105",
    "issueDescription": "Projector not turning on"
  }' | jq '.id')

echo "Created Ticket ID: $TICKET_ID"

# 2. View all PENDING tickets
curl http://localhost:8082/api/ticketing/tickets?status=PENDING | jq '.'

# 3. Get the specific ticket
curl http://localhost:8082/api/ticketing/tickets/$TICKET_ID | jq '.'

# 4. Move ticket to IN_PROGRESS
curl -X PUT http://localhost:8082/api/ticketing/tickets/$TICKET_ID/status \
  -H "Content-Type: application/json" \
  -d '{"status": "IN_PROGRESS"}' | jq '.'

# 5. Move ticket to RESOLVED
curl -X PUT http://localhost:8082/api/ticketing/tickets/$TICKET_ID/status \
  -H "Content-Type: application/json" \
  -d '{"status": "RESOLVED"}' | jq '.'

# 6. Verify RESOLVED
curl http://localhost:8082/api/ticketing/tickets/$TICKET_ID | jq '.status'
```

---

## Troubleshooting

### Issue: Port 8082 Already in Use

```bash
# Find process using port
lsof -i :8082

# Kill the process (replace PID with actual)
kill -9 <PID>
```

### Issue: Build Fails

```bash
# Clear Maven cache and rebuild
mvn clean install -U
```

### Issue: H2 Console Inaccessible

- Verify `spring.h2.console.enabled=true` in application.properties
- Access URL: `http://localhost:8082/h2-console`

---

## Production Deployment Checklist

- [ ] Change `spring.jpa.hibernate.ddl-auto` from `create-drop` to `validate`
- [ ] Remove `spring.h2.console.enabled=true` (disable H2 console)
- [ ] Use PostgreSQL instead of H2 (update dependencies and datasource URL)
- [ ] Add Spring Security for API authentication
- [ ] Implement request logging and audit trails
- [ ] Add API rate limiting/throttling
- [ ] Configure CI/CD pipeline (GitHub Actions, Jenkins, etc.)
- [ ] Add comprehensive unit and integration tests
- [ ] Implement monitoring and alerting (Prometheus, Grafana)

---

## Additional Resources

- **Spring Boot Documentation:** https://spring.io/projects/spring-boot
- **Spring Data JPA:** https://spring.io/projects/spring-data-jpa
- **H2 Database:** http://www.h2database.com/
- **REST API Best Practices:** https://restfulapi.net/

---

## Author & License

This is a university project demonstrating SOA principles.
Created: April 2026
