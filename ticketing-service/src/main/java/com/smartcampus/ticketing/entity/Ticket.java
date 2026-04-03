package com.smartcampus.ticketing.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

/**
 * Ticket Entity Class - Represents a maintenance issue report in the Smart Campus System.
 * 
 * Architectural Rationale (Layered Architecture):
 * - This entity is part of the ENTITY layer, responsible for data representation.
 * - JPA annotations (@Entity, @Table) decouple persistence logic from business logic.
 * - The entity is NOT exposed directly to the Controller; it's transformed to DTOs if needed.
 * - This separation ensures changes to database schema don't cascade to API contracts.
 * 
 * State Management:
 * - The 'status' field tracks the ticket lifecycle (PENDING -> IN_PROGRESS -> RESOLVED).
 * - Default status is PENDING, enforced via @Column(columnDefinition).
 * - Only the Service layer can modify status, maintaining transaction integrity.
 */
@Entity
@Table(name = "tickets", indexes = {
    @Index(name = "idx_status", columnList = "status"),
    @Index(name = "idx_reported_by", columnList = "reported_by_user_id")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Ticket {

    /**
     * Unique identifier for the ticket.
     * Generated automatically by the database (auto-increment).
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * User ID of the person reporting the issue.
     * This is a foreign key reference to the user who filed the complaint.
     * In a real system, this would link to a User entity in a separate service.
     */
    @Column(name = "reported_by_user_id", nullable = false)
    private Long reportedByUserId;

    /**
     * Physical location where the issue was reported.
     * Examples: "Building A, Room 105", "Library, Third Floor"
     */
    @Column(nullable = false)
    private String location;

    /**
     * Detailed description of the maintenance issue.
     * Examples: "Projector not turning on", "Wi-Fi dead in conference room"
     */
    @Column(nullable = false, columnDefinition = "TEXT")
    private String issueDescription;

    /**
     * Timestamp when the issue was first reported.
     * Used for SLA tracking and reporting metrics.
     */
    @Column(nullable = false)
    private LocalDateTime reportTime;

    /**
     * Current status of the ticket in its lifecycle.
     * 
     * State Machine (enforced by Service layer):
     * - Default: PENDING
     * - Transition: PENDING -> IN_PROGRESS -> RESOLVED
     * - Enum ensures only valid states are stored.
     * 
     * Rationale for Enum over String:
     * - Type-safety: Prevents typos and invalid states.
     * - Database constraint: H2 stores as string but application enforces type.
     * - Discoverability: Developers can auto-complete TicketStatus values.
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "VARCHAR(20) DEFAULT 'PENDING'")
    private TicketStatus status;

    /**
     * JPA lifecycle hook: Automatically sets the current timestamp
     * when a new ticket is created. This ensures every ticket has
     * an accurate creation time without requiring client input.
     */
    @PrePersist
    private void prePersist() {
        if (this.reportTime == null) {
            this.reportTime = LocalDateTime.now();
        }
        if (this.status == null) {
            this.status = TicketStatus.PENDING;
        }
    }
}
