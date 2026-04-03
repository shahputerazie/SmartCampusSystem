# Deployment & Running Guide

## Quick Start (Development)

### Prerequisites

- Java 17+ installed
- Maven 3.6+ installed
- Port 8082 available

### Step 1: Navigate to Project

```bash
cd ~/Sites/SmartCampusSystem/ticketing-service
```

### Step 2: Build

```bash
mvn clean package
```

### Step 3: Run

```bash
mvn spring-boot:run
```

**Expected Output (last few lines):**

```
Started TicketingServiceApplication in XX.XXX seconds (JVM running for XX.XXX)
```

### Step 4: Verify Service is Running

```bash
curl http://localhost:8082/api/ticketing/tickets/health
```

**Expected Response:**

```json
{
    "status": "UP",
    "service": "ticketing-service"
}
```

---

## Alternative: Run as JAR

### Build JAR

```bash
mvn clean package
```

### Run JAR

```bash
java -jar target/ticketing-service-1.0.0.jar
```

---

## Docker Deployment (Optional Future Enhancement)

If you want to containerize this service:

```dockerfile
FROM eclipse-temurin:17-jre

WORKDIR /app

COPY target/ticketing-service-1.0.0.jar /app/ticketing-service.jar

EXPOSE 8082

CMD ["java", "-jar", "ticketing-service.jar"]
```

Build & Run:

```bash
docker build -t ticketing-service:1.0.0 .
docker run -p 8082:8082 ticketing-service:1.0.0
```

---

## Development Tips

### IDE Setup (VS Code)

1. Install Extensions:
    - Extension Pack for Java
    - Spring Boot Extension Pack
    - Lombok Annotations Support for VS Code

2. Open in VS Code:

    ```bash
    code ~/Sites/SmartCampusSystem/ticketing-service
    ```

3. Create a Spring Boot run configuration in `.vscode/launch.json`:
    ```json
    {
        "version": "0.2.0",
        "configurations": [
            {
                "name": "Spring Boot App",
                "type": "java",
                "name": "Spring Boot App",
                "request": "launch",
                "mainClass": "com.smartcampus.ticketing.TicketingServiceApplication",
                "projectName": "ticketing-service",
                "preLaunchTask": "maven: install"
            }
        ]
    }
    ```

### IDE Setup (IntelliJ IDEA)

1. Open Project: File → Open → Select ticketing-service folder
2. Wait for Maven indexing to complete
3. Run → Edit Configurations → Add new Spring Boot configuration
4. Main class: `com.smartcampus.ticketing.TicketingServiceApplication`
5. Click Run (Shift+F10)

---

## Testing the API

### Using cURL (macOS/Linux)

```bash
# Health check
curl http://localhost:8082/api/ticketing/tickets/health

# Create a ticket
curl -X POST http://localhost:8082/api/ticketing/tickets \
  -H "Content-Type: application/json" \
  -d '{
    "reportedByUserId": 1,
    "location": "Room 101",
    "issueDescription": "Test issue"
  }'

# Get all tickets
curl http://localhost:8082/api/ticketing/tickets | jq

# Get PENDING tickets
curl http://localhost:8082/api/ticketing/tickets?status=PENDING | jq
```

### Using Postman

1. Import the API endpoints (manual setup):
    - **Base URL:** http://localhost:8082/api/ticketing
    - **Collections:**
        - POST /tickets (body: JSON with user data)
        - GET /tickets
        - GET /tickets?status=PENDING
        - GET /tickets/{id}
        - PUT /tickets/{id}/status

### Using VS Code REST Client Extension

Create `requests.rest` file:

```
### Health Check
GET http://localhost:8082/api/ticketing/tickets/health

### Create Ticket
POST http://localhost:8082/api/ticketing/tickets
Content-Type: application/json

{
  "reportedByUserId": 101,
  "location": "Building A, Room 105",
  "issueDescription": "Projector malfunction"
}

### Get All Tickets
GET http://localhost:8082/api/ticketing/tickets

### Get PENDING Tickets
GET http://localhost:8082/api/ticketing/tickets?status=PENDING

### Get Specific Ticket
GET http://localhost:8082/api/ticketing/tickets/1

### Update Status to IN_PROGRESS
PUT http://localhost:8082/api/ticketing/tickets/1/status
Content-Type: application/json

{
  "status": "IN_PROGRESS"
}

### Update Status to RESOLVED
PUT http://localhost:8082/api/ticketing/tickets/1/status
Content-Type: application/json

{
  "status": "RESOLVED"
}
```

---

## Accessing H2 Database Console

1. Start the service (running on port 8082)
2. Navigate to: http://localhost:8082/h2-console
3. Connection Details:
    - JDBC URL: `jdbc:h2:mem:ticketing_db`
    - User Name: `sa`
    - Password: (leave blank)
4. Click "Connect"

### Useful SQL Queries

```sql
-- View all tickets
SELECT * FROM tickets;

-- Count tickets by status
SELECT status, COUNT(*) as count FROM tickets GROUP BY status;

-- Find all PENDING tickets
SELECT * FROM tickets WHERE status = 'PENDING';

-- View tickets created in last hour
SELECT * FROM tickets WHERE report_time > DATEADD('HOUR', -1, NOW());

-- Delete all test data (reset)
DELETE FROM tickets;
```

---

## Troubleshooting Guide

### Problem: Port 8082 Already in Use

**Solution 1: Kill existing process**

```bash
lsof -i :8082
kill -9 <PID>
```

**Solution 2: Change port temporarily**

```bash
mvn spring-boot:run -Dspring-boot.run.arguments="--server.port=8083"
```

### Problem: Java Version Mismatch

**Error:** `Unsupported class version 61.0`

**Solution:**

```bash
# Check Java version
java -version

# Should show Java 17+
# If not, install Java 17:
# macOS: brew install openjdk@17
# Linux: sudo apt-get install openjdk-17-jdk
```

### Problem: Maven Build Fails

**Solution: Clear cache and rebuild**

```bash
mvn clean install -U
rm -rf ~/.m2/repository
mvn clean install
```

### Problem: H2 Console Not Accessible

**Check application.properties:**

```properties
spring.h2.console.enabled=true  # Should be true
spring.h2.console.path=/h2-console  # Path config
```

Then access: http://localhost:8082/h2-console

### Problem: Database Clear on Restart

This is **expected behavior** because of:

```properties
spring.jpa.hibernate.ddl-auto=create-drop
```

This is intentional for development. For persistent data, change to:

```properties
spring.jpa.hibernate.ddl-auto=update
```

---

## Performance Optimization Tips

### 1. Disable SQL Logging in Production

```properties
spring.jpa.show-sql=false
spring.jpa.properties.hibernate.format_sql=false
```

### 2. Add Connection Pooling (for larger deployments)

```xml
<!-- In pom.xml -->
<dependency>
    <groupId>com.zaxxer</groupId>
    <artifactId>HikariCP</artifactId>
</dependency>
```

### 3. Enable Query Caching

```properties
spring.jpa.properties.hibernate.cache.use_second_level_cache=true
spring.jpa.properties.hibernate.cache.region.factory_class=org.hibernate.cache.jcache.JCacheRegionFactory
```

---

## Git Operations

### Commit Initial Project

```bash
cd ~/Sites/SmartCampusSystem/ticketing-service
git add .
git commit -m "feat: Add ticketing service with SOA architecture"
git push origin main
```

### Branch Management

```bash
# Create feature branch
git checkout -b feature/ticket-notifications

# Make changes, then commit
git add .
git commit -m "feat: Add email notifications to ticket updates"
git push origin feature/ticket-notifications
```

---

## Next Steps for Production

1. **Add Spring Security**
    - Implement JWT authentication
    - Add role-based access control

2. **Database Migration**
    - Replace H2 with PostgreSQL or MySQL
    - Set up proper database migrations (Flyway/Liquibase)

3. **Logging & Monitoring**
    - Integrate SLF4J with Logback
    - Add Prometheus metrics
    - Setup ELK stack for log aggregation

4. **Testing**
    - Write unit tests for Service layer
    - Write integration tests for Controller
    - Achieve >80% code coverage

5. **CI/CD Pipeline**
    - GitHub Actions for automated testing
    - Docker containerization
    - Kubernetes deployment

6. **Documentation**
    - Generate API documentation with Swagger/Springdoc-OpenAPI
    - Add architecture diagrams
    - Create deployment runbooks

---

Last Updated: April 2026
