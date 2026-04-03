package com.smartcampus.ticketing.repository;

import com.smartcampus.ticketing.entity.Ticket;
import com.smartcampus.ticketing.entity.TicketStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

/**
 * TicketRepository Interface - Data Access Layer for Ticket entities.
 * 
 * Architectural Rationale (Repository Pattern):
 * - This interface abstracts database operations from business logic.
 * - Spring Data JPA provides CRUD operations automatically via JpaRepository.
 * - Custom finder methods (e.g., findByStatus) separate data queries from service logic.
 * - If database changes (e.g., from H2 to PostgreSQL), only this layer needs modification.
 * 
 * SOA Design Principle:
 * - Data persistence is isolated to this layer.
 * - Controllers never directly access the database; they use the Service layer.
 * - This ensures data consistency and allows for transactional management in the Service layer.
 */
@Repository
public interface TicketRepository extends JpaRepository<Ticket, Long> {

    /**
     * Custom finder method to retrieve all tickets with a specific status.
     * 
     * Rationale:
     * - Allows efficient filtering of tickets by their current state.
     * - Example use case: Display all PENDING tickets to technicians.
     * - Spring Data JPA automatically generates the SQL query based on method name.
     * - Query: SELECT * FROM tickets WHERE status = ?
     * 
     * @param status The ticket status to filter by (PENDING, IN_PROGRESS, RESOLVED)
     * @return List of tickets matching the given status
     */
    List<Ticket> findByStatus(TicketStatus status);
}
