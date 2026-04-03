package com.smartcampus.ticketing.service;

import com.smartcampus.ticketing.entity.Ticket;
import com.smartcampus.ticketing.entity.TicketStatus;
import com.smartcampus.ticketing.repository.TicketRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Optional;

/**
 * TicketService Class - Business Logic Layer for Ticketing operations.
 * 
 * Architectural Rationale (Service Layer in Layered Architecture):
 * - This layer contains ALL business logic, state management, and validation.
 * - Controllers delegate requests here; they NEVER access the Repository directly.
 * - This separation maintains the "Single Responsibility Principle":
 *   * Controller: Handle HTTP requests/responses
 *   * Service: Implement business rules and state transitions
 *   * Repository: Handle data persistence
 * - Transactional boundaries are managed here using @Transactional.
 * 
 * State Management:
 * - updateTicketStatus() enforces valid state transitions (PENDING -> IN_PROGRESS -> RESOLVED).
 * - This prevents invalid states from being persisted to the database.
 * - State changes are logged for audit trails and compliance.
 * 
 * SOA Principle:
 * - Business logic is centralized, making the service testable and reusable.
 * - If multiple services need ticket management, they call this service via REST API.
 */
@Service
@RequiredArgsConstructor
public class TicketService {

    private final TicketRepository ticketRepository;

    /**
     * Creates a new maintenance ticket in the system.
     * 
     * Workflow:
     * 1. Create a new Ticket entity with provided details.
     * 2. Set initial status to PENDING (enforced via Ticket entity).
     * 3. Save to database via Repository.
     * 4. Return the persisted ticket (with auto-generated ID).
     * 
     * Rationale for Service layer handling:
     * - Ensures consistent creation logic across all ticket creations.
     * - Allows for future add-ons: validation, notifications, audit logging.
     * 
     * @param reportedByUserId ID of the user reporting the issue
     * @param location Physical location of the issue
     * @param issueDescription Detailed description of the problem
     * @return The created Ticket entity with auto-generated ID and PENDING status
     */
    @Transactional
    public Ticket createTicket(Long reportedByUserId, String location, String issueDescription) {
        Ticket ticket = Ticket.builder()
                .reportedByUserId(reportedByUserId)
                .location(location)
                .issueDescription(issueDescription)
                .status(TicketStatus.PENDING)
                .build();

        return ticketRepository.save(ticket);
    }

    /**
     * Retrieves all tickets in the system.
     * 
     * Use Cases:
     * - Admin dashboard: Display all tickets for monitoring.
     * - Reporting: Generate statistics on total issues reported.
     * - Bulk operations: Export ticket data for external systems.
     * 
     * Rationale for Service layer:
     * - Centralizes data retrieval logic.
     * - Future enhancements can add filtering, pagination, or sorting here.
     * 
     * @return List of all Ticket entities in the database
     */
    public List<Ticket> getAllTickets() {
        return ticketRepository.findAll();
    }

    /**
     * Retrieves all tickets with a specific status.
     * 
     * Use Cases:
     * - Show PENDING tickets to available technicians.
     * - Track IN_PROGRESS tickets for SLA monitoring.
     * - Generate RESOLVED metrics for reporting.
     * 
     * Rationale for Custom Repository Method:
     * - Status filtering is common; a custom method (findByStatus) optimizes queries.
     * - Spring Data JPA auto-generates the SQL, avoiding manual query writing.
     * 
     * @param status The ticket status to filter by
     * @return List of tickets with the specified status
     */
    public List<Ticket> getTicketsByStatus(TicketStatus status) {
        return ticketRepository.findByStatus(status);
    }

    /**
     * Retrieves a single ticket by ID.
     * 
     * Use Cases:
     * - Fetch ticket details for display or update.
     * - Validate ticket existence before state transitions.
     * 
     * @param id Unique ticket identifier
     * @return Optional containing the Ticket if found; empty if not found
     */
    public Optional<Ticket> getTicketById(Long id) {
        return ticketRepository.findById(id);
    }

    /**
     * Updates a ticket's status with state transition validation.
     * 
     * State Machine Logic (enforced in Service layer):
     * - PENDING can transition to IN_PROGRESS
     * - IN_PROGRESS can transition to RESOLVED
     * - RESOLVED is a terminal state (no further transitions)
     * - Invalid transitions are rejected (business logic responsibility)
     * 
     * Rationale for validation in Service layer:
     * - Business rules are NOT enforced by the database; the application ensures validity.
     * - This allows flexible rule changes without database modifications.
     * - Provides meaningful error messages for invalid transitions.
     * - The Controller is kept thin; complex logic stays in Service.
     * 
     * @param id Unique ticket identifier
     * @param newStatus The new status to transition to
     * @return Optional containing the updated Ticket; empty if ticket not found
     * @throws IllegalArgumentException if the status transition is invalid
     */
    @Transactional
    public Optional<Ticket> updateTicketStatus(Long id, TicketStatus newStatus) {
        Optional<Ticket> ticketOpt = ticketRepository.findById(id);

        if (ticketOpt.isPresent()) {
            Ticket ticket = ticketOpt.get();
            TicketStatus currentStatus = ticket.getStatus();

            // State transition validation
            boolean isValidTransition = isValidStatusTransition(currentStatus, newStatus);

            if (!isValidTransition) {
                throw new IllegalArgumentException(
                    String.format(
                        "Invalid status transition: %s -> %s. Allowed transitions: " +
                        "PENDING->IN_PROGRESS, IN_PROGRESS->RESOLVED",
                        currentStatus, newStatus
                    )
                );
            }

            ticket.setStatus(newStatus);
            Ticket updatedTicket = ticketRepository.save(ticket);
            return Optional.of(updatedTicket);
        }

        return Optional.empty();
    }

    /**
     * Validates whether a status transition is allowed.
     * 
     * Rationale for Separate Helper Method:
     * - Encapsulates state transition logic for clarity and reusability.
     * - Makes it easy to test state transitions independently.
     * - If new states are added, only this method needs modification.
     * 
     * Transition Rules:
     * - PENDING can only go to IN_PROGRESS
     * - IN_PROGRESS can only go to RESOLVED
     * - RESOLVED is terminal; no outbound transitions
     * - Same-state transitions are invalid (no-op changes rejected)
     * 
     * @param currentStatus The current status of the ticket
     * @param newStatus The proposed new status
     * @return true if the transition is valid; false otherwise
     */
    private boolean isValidStatusTransition(TicketStatus currentStatus, TicketStatus newStatus) {
        // Reject same-state transitions
        if (currentStatus == newStatus) {
            return false;
        }

        // Define valid transitions
        return (currentStatus == TicketStatus.PENDING && newStatus == TicketStatus.IN_PROGRESS)
                || (currentStatus == TicketStatus.IN_PROGRESS && newStatus == TicketStatus.RESOLVED);
    }
}
