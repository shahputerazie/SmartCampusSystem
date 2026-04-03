package com.smartcampus.ticketing.entity;

/**
 * Enum representing the lifecycle states of a maintenance ticket.
 * 
 * State Management Rationale:
 * - Enums provide type-safe state representation, preventing invalid status transitions.
 * - This ensures data integrity: a ticket can only have one of these predefined states.
 * - State transitions (PENDING -> IN_PROGRESS -> RESOLVED) are managed by the Service layer,
 *   not the Controller, following the Single Responsibility Principle.
 */
public enum TicketStatus {
    /**
     * Initial state when a ticket is first reported.
     * The issue has been logged but not yet assigned to a technician.
     */
    PENDING("Pending"),

    /**
     * State when a technician has begun working on the reported issue.
     * Active maintenance is underway.
     */
    IN_PROGRESS("In Progress"),

    /**
     * Final state when the issue has been successfully resolved.
     * The reported maintenance problem is fixed.
     */
    RESOLVED("Resolved");

    private final String displayName;

    TicketStatus(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
