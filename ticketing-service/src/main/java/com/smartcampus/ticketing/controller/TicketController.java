package com.smartcampus.ticketing.controller;

import com.smartcampus.ticketing.entity.Ticket;
import com.smartcampus.ticketing.entity.TicketStatus;
import com.smartcampus.ticketing.service.TicketService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

/**
 * TicketController Class - REST API Layer for Ticketing operations.
 * 
 * Architectural Rationale (Controller in Layered Architecture):
 * - This layer ONLY handles HTTP request/response mapping.
 * - Controllers NEVER contain business logic; they delegate to the Service layer.
 * - This separation ensures:
 *   * Easy testing (mock the Service layer)
 *   * Reusable business logic (multiple endpoints can call the same Service method)
 *   * Clean REST API contracts (no database leak-through)
 * 
 * SOA Principle - Stateless Service:
 * - Each endpoint is stateless; no session data is stored.
 * - Clients are responsible for tracking ticket IDs and state.
 * - Service can scale horizontally; any instance can handle any request.
 * 
 * REST Convention:
 * - POST: Create new resource (201 Created on success)
 * - GET: Retrieve resources (200 OK)
 * - PUT/PATCH: Modify existing resource (200 OK or 400 Bad Request)
 * - DELETE: Not implemented (tickets are immutable once created; status tracks changes)
 */
@RestController
@RequestMapping("/tickets")
@RequiredArgsConstructor
public class TicketController {

    private final TicketService ticketService;

    /**
     * POST /api/ticketing/tickets - Create a new maintenance ticket.
     * 
     * Request Body Example:
     * {
     *   "reportedByUserId": 123,
     *   "location": "Building A, Room 105",
     *   "issueDescription": "Projector not responding to command signals"
     * }
     * 
     * Response: 201 Created with Ticket entity including auto-generated ID and PENDING status.
     * 
     * Rationale for Service delegation:
     * - Controller accepts HTTP input and validates presence of required fields.
     * - Service layer sets the initial status to PENDING.
     * - This flow ensures consistent ticket creation logic.
     * 
     * @param request Map containing reportedByUserId, location, issueDescription
     * @return ResponseEntity with HTTP 201 Created and the created Ticket
     */
    @PostMapping
    public ResponseEntity<Ticket> createTicket(@RequestBody Map<String, Object> request) {
        Long reportedByUserId = Long.valueOf(request.get("reportedByUserId").toString());
        String location = request.get("location").toString();
        String issueDescription = request.get("issueDescription").toString();

        Ticket createdTicket = ticketService.createTicket(reportedByUserId, location, issueDescription);

        return ResponseEntity.status(HttpStatus.CREATED).body(createdTicket);
    }

    /**
     * GET /api/ticketing/tickets - Retrieve all tickets.
     * 
     * Query Parameters (optional):
     * - status: Filter by ticket status (PENDING, IN_PROGRESS, RESOLVED)
     *   Example: GET /tickets?status=PENDING
     * 
     * Response: 200 OK with List of all Ticket entities (or filtered by status).
     * 
     * Rationale for conditional filtering:
     * - Endpoint flexibility: Supports both "all tickets" and "filtered by status" queries.
     * - Service layer provides the custom findByStatus() method for efficient filtering.
     * 
     * @param status Optional query parameter to filter tickets by status
     * @return ResponseEntity with HTTP 200 OK and List<Ticket>
     */
    @GetMapping
    public ResponseEntity<List<Ticket>> getAllTickets(
            @RequestParam(name = "status", required = false) String status) {

        List<Ticket> tickets;

        if (status != null && !status.isEmpty()) {
            try {
                TicketStatus ticketStatus = TicketStatus.valueOf(status.toUpperCase());
                tickets = ticketService.getTicketsByStatus(ticketStatus);
            } catch (IllegalArgumentException e) {
                // Invalid status value provided
                return ResponseEntity.badRequest().build();
            }
        } else {
            tickets = ticketService.getAllTickets();
        }

        return ResponseEntity.ok(tickets);
    }

    /**
     * GET /api/ticketing/tickets/{id} - Retrieve a specific ticket by ID.
     * 
     * Path Parameter:
     * - id: Unique ticket identifier (numeric)
     * 
     * Response:
     * - 200 OK with Ticket entity if found
     * - 404 Not Found if ticket does not exist
     * 
     * Rationale:
     * - Enables clients to fetch details for a specific ticket.
     * - Error handling: 404 clearly indicates resource doesn't exist.
     * 
     * @param id Unique ticket identifier
     * @return ResponseEntity with Ticket (200 OK) or empty body (404 Not Found)
     */
    @GetMapping("/{id}")
    public ResponseEntity<Ticket> getTicketById(@PathVariable Long id) {
        return ticketService.getTicketById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    /**
     * PUT /api/ticketing/tickets/{id}/status - Update a ticket's status.
     * 
     * Path Parameter:
     * - id: Unique ticket identifier
     * 
     * Request Body Example:
     * {
     *   "status": "IN_PROGRESS"
     * }
     * 
     * Response:
     * - 200 OK with updated Ticket entity if status change succeeds
     * - 404 Not Found if ticket does not exist
     * - 400 Bad Request if status transition is invalid
     * 
     * State Transition Validation (enforced in Service layer):
     * - PENDING can transition to IN_PROGRESS
     * - IN_PROGRESS can transition to RESOLVED
     * - Invalid transitions raise IllegalArgumentException, caught here as 400 Bad Request
     * 
     * Rationale for PUT vs PATCH:
     * - PUT is used because we're updating a complete resource attribute (status).
     * - PATCH could be used if we're updating part of the resource, but status is a full field update.
     * 
     * @param id Unique ticket identifier
     * @param request Map containing the new status value
     * @return ResponseEntity with updated Ticket (200 OK), 404, or 400 Bad Request
     */
    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateTicketStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> request) {

        try {
            String statusStr = request.get("status");
            if (statusStr == null || statusStr.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Status field is required"));
            }

            TicketStatus newStatus = TicketStatus.valueOf(statusStr.toUpperCase());

            return ticketService.updateTicketStatus(id, newStatus)
                    .map(ResponseEntity::ok)
                    .orElseGet(() -> ResponseEntity.notFound().build());

        } catch (IllegalArgumentException e) {
            // Either invalid enum value or invalid state transition
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * GET /api/ticketing/health - Health check endpoint for service availability.
     * 
     * Rationale:
     * - Simple endpoint to verify the service is running.
     * - Used by load balancers and monitoring systems in SOA deployments.
     * - Does not require database access; indicates application availability.
     * 
     * @return ResponseEntity with HTTP 200 OK and status message
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of("status", "UP", "service", "ticketing-service"));
    }
}
