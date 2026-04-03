package com.smartcampus.ticketing;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Main Spring Boot Application Class for the Ticketing Service.
 * 
 * Rationale (SOA Design Pattern):
 * - This service is a standalone microservice in the Smart Campus System.
 * - It operates independently on port 8082 with its own database (H2).
 * - The service can be deployed, scaled, and updated independently without
 *   affecting other services in the SOA architecture.
 * - Spring Boot auto-configuration simplifies the setup while maintaining
 *   the layered architecture pattern internally.
 */
@SpringBootApplication
public class TicketingServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(TicketingServiceApplication.class, args);
    }
}
