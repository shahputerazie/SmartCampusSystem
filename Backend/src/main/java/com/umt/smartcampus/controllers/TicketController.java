package com.umt.smartcampus.controllers;

import com.umt.smartcampus.dto.TicketAssignmentUpdateRequest;
import com.umt.smartcampus.dto.TicketCommentRequest;
import com.umt.smartcampus.dto.TicketCommentResponse;
import com.umt.smartcampus.dto.TicketResponse;
import com.umt.smartcampus.dto.TicketStatusUpdateRequest;
import com.umt.smartcampus.dto.TicketSummaryResponse;
import com.umt.smartcampus.models.Comment;
import com.umt.smartcampus.models.SupportCategory;
import com.umt.smartcampus.models.Ticket;
import com.umt.smartcampus.models.User;
import com.umt.smartcampus.repositories.CommentRepository;
import com.umt.smartcampus.repositories.SupportCategoryRepository;
import com.umt.smartcampus.repositories.TicketRepository;
import com.umt.smartcampus.security.AuthInterceptor;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Set;

@RestController // Tells Spring this handles web requests
@RequestMapping("/api/tickets")
@CrossOrigin(origins = "*") // All URLs will start with /api/tickets
public class TicketController {

    private static final Set<String> VALID_STATUSES = Set.of("OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED");
    private static final Set<String> OPERATIONS_ROLES = Set.of("ADMIN", "STAFF");
    private static final String ASSIGNEE_ROLE = "ASSIGNEE";

    private final TicketRepository ticketRepository;
    private final CommentRepository commentRepository;
    private final SupportCategoryRepository supportCategoryRepository;

    public TicketController(
            TicketRepository ticketRepository,
            CommentRepository commentRepository,
            SupportCategoryRepository supportCategoryRepository
    ) {
        this.ticketRepository = ticketRepository;
        this.commentRepository = commentRepository;
        this.supportCategoryRepository = supportCategoryRepository;
    }

    // 1. GET ALL TICKETS (To show on the dashboard)
    @GetMapping
    public List<TicketResponse> getAllTickets(HttpServletRequest request) {
        requireOperationsUser(request);
        return ticketRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::toTicketResponse)
                .toList();
    }

    @GetMapping("/assigned")
    public List<TicketResponse> getAssignedTickets(HttpServletRequest request) {
        User authenticatedUser = requireAssigneeUser(request);
        return ticketRepository.findByAssigneeIgnoreCaseOrderByCreatedAtDesc(authenticatedUser.getUsername()).stream()
                .map(this::toTicketResponse)
                .toList();
    }

    // 2. CREATE A TICKET (When a student submits the form)
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TicketResponse createTicket(@RequestBody Ticket ticket, HttpServletRequest request) {
        User authenticatedUser = getOptionalAuthenticatedUser(request);
        validateTicket(ticket);
        SupportCategory supportCategory = findSupportCategory(ticket.getCategory());

        ticket.setStatus(normalizeStatus(ticket.getStatus()));
        ticket.setUser(authenticatedUser);
        ticket.setCategory(supportCategory.getName());
        ticket.setAssignee(ticket.getAssignee() == null || ticket.getAssignee().isBlank() ? null : ticket.getAssignee().trim());
        ticket.setLocation(defaultIfBlank(ticket.getLocation(), supportCategory.getDefaultLocation()));
        ticket.setRequesterName(resolveRequesterName(ticket, authenticatedUser));
        ticket.setRequesterEmail(resolveRequesterEmail(ticket, authenticatedUser));

        Ticket savedTicket = ticketRepository.save(ticket);
        return toTicketResponse(savedTicket);
    }

    @GetMapping("/{ticketId}")
    public TicketResponse getTicket(@PathVariable Long ticketId, HttpServletRequest request) {
        return toTicketResponse(requireTicketAccess(ticketId, request));
    }

    @PatchMapping("/{ticketId}/status")
    public TicketResponse updateTicketStatus(
            @PathVariable Long ticketId,
            @RequestBody TicketStatusUpdateRequest requestBody,
            HttpServletRequest request
    ) {
        User authenticatedUser = requireStatusUpdateAccess(ticketId, request);
        String normalizedStatus = normalizeStatus(requestBody.getStatus());

        if (!VALID_STATUSES.contains(normalizedStatus)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid ticket status.");
        }

        Ticket ticket = findTicket(ticketId);
        ticket.setStatus(normalizedStatus);
        Ticket updatedTicket = ticketRepository.save(ticket);

        Comment auditComment = new Comment();
        auditComment.setTicket(updatedTicket);
        auditComment.setUser(authenticatedUser);
        auditComment.setAuthorName(defaultIfBlank(authenticatedUser.getUsername(), "SCSS System"));
        auditComment.setAuthorRole(displayRole(authenticatedUser.getRole()));
        auditComment.setMessage("Status changed to " + normalizedStatus + ".");
        commentRepository.save(auditComment);

        return toTicketResponse(updatedTicket);
    }

    @PatchMapping("/{ticketId}/assignee")
    public TicketResponse updateTicketAssignee(
            @PathVariable Long ticketId,
            @RequestBody TicketAssignmentUpdateRequest requestBody,
            HttpServletRequest request
    ) {
        User authenticatedUser = requireOperationsUser(request);

        if (requestBody.getAssignee() == null || requestBody.getAssignee().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Assignee is required.");
        }

        Ticket ticket = findTicket(ticketId);
        ticket.setAssignee(requestBody.getAssignee().trim());
        Ticket updatedTicket = ticketRepository.save(ticket);

        Comment auditComment = new Comment();
        auditComment.setTicket(updatedTicket);
        auditComment.setUser(authenticatedUser);
        auditComment.setAuthorName(defaultIfBlank(authenticatedUser.getUsername(), "Dispatch Desk"));
        auditComment.setAuthorRole(displayRole(authenticatedUser.getRole()));
        auditComment.setMessage("Ticket assigned to " + updatedTicket.getAssignee() + ".");
        commentRepository.save(auditComment);

        return toTicketResponse(updatedTicket);
    }

    @GetMapping("/{ticketId}/comments")
    public List<TicketCommentResponse> getTicketComments(@PathVariable Long ticketId, HttpServletRequest request) {
        Ticket ticket = requireTicketAccess(ticketId, request);
        return commentRepository.findByTicketIdOrderByCreatedAtDesc(ticket.getId()).stream()
                .map(TicketCommentResponse::from)
                .toList();
    }

    @PostMapping("/{ticketId}/comments")
    public TicketResponse addTicketComment(
            @PathVariable Long ticketId,
            @RequestBody TicketCommentRequest requestBody,
            HttpServletRequest request
    ) {
        User authenticatedUser = requireCommentAccess(ticketId, request);

        if (requestBody.getMessage() == null || requestBody.getMessage().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Comment message is required.");
        }

        Ticket ticket = findTicket(ticketId);

        Comment comment = new Comment();
        comment.setTicket(ticket);
        comment.setUser(authenticatedUser);
        comment.setMessage(requestBody.getMessage().trim());
        comment.setAuthorName(defaultIfBlank(requestBody.getAuthorName(), authenticatedUser.getUsername()));
        comment.setAuthorRole(defaultIfBlank(requestBody.getAuthorRole(), displayRole(authenticatedUser.getRole())));

        commentRepository.save(comment);
        return toTicketResponse(ticket);
    }

    @GetMapping("/summary")
    public TicketSummaryResponse getTicketSummary(HttpServletRequest request) {
        requireOperationsUser(request);
        return new TicketSummaryResponse(
                ticketRepository.count(),
                ticketRepository.countByStatus("OPEN"),
                ticketRepository.countByStatus("IN_PROGRESS"),
                ticketRepository.countByStatus("RESOLVED"),
                ticketRepository.countByStatus("CLOSED")
        );
    }

    private Ticket findTicket(Long ticketId) {
        return ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ticket not found."));
    }

    private void ensureTicketExists(Long ticketId) {
        if (!ticketRepository.existsById(ticketId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Ticket not found.");
        }
    }

    private Ticket requireTicketAccess(Long ticketId, HttpServletRequest request) {
        User user = getAuthenticatedUser(request);
        Ticket ticket = findTicket(ticketId);

        if (isOperationsUser(user) || isAssignedToUser(ticket, user)) {
            return ticket;
        }

        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not have access to this ticket.");
    }

    private User requireStatusUpdateAccess(Long ticketId, HttpServletRequest request) {
        User user = getAuthenticatedUser(request);
        Ticket ticket = findTicket(ticketId);

        if (isOperationsUser(user) || isAssignedToUser(ticket, user)) {
            return user;
        }

        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not have access to update this ticket.");
    }

    private User requireCommentAccess(Long ticketId, HttpServletRequest request) {
        return requireStatusUpdateAccess(ticketId, request);
    }

    private String defaultIfBlank(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value.trim();
    }

    private String normalizeStatus(String status) {
        return status == null ? "OPEN" : status.trim().toUpperCase();
    }

    private void validateTicket(Ticket ticket) {
        if (ticket == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ticket payload is required.");
        }

        if (ticket.getTitle() == null || ticket.getTitle().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ticket title is required.");
        }

        if (ticket.getCategory() == null || ticket.getCategory().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ticket category is required.");
        }

        if (ticket.getDescription() == null || ticket.getDescription().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ticket description is required.");
        }

        if (ticket.getRequesterName() == null || ticket.getRequesterName().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Requester name is required.");
        }

        if (ticket.getRequesterEmail() == null || ticket.getRequesterEmail().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Requester email is required.");
        }

        String normalizedEmail = ticket.getRequesterEmail().trim();
        if (!normalizedEmail.contains("@") || normalizedEmail.startsWith("@") || normalizedEmail.endsWith("@")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Requester email is invalid.");
        }
    }

    private TicketResponse toTicketResponse(Ticket ticket) {
        return TicketResponse.from(ticket, commentRepository.findByTicketIdOrderByCreatedAtDesc(ticket.getId()));
    }

    private SupportCategory findSupportCategory(String categoryName) {
        return supportCategoryRepository.findByNameIgnoreCase(categoryName == null ? "" : categoryName.trim())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selected category does not exist."));
    }

    private String displayRole(String role) {
        if (role == null || role.isBlank()) {
            return "Staff";
        }

        return switch (role.trim().toUpperCase()) {
            case "ADMIN" -> "Admin";
            case "STAFF" -> "Staff";
            case ASSIGNEE_ROLE -> "Assignee";
            default -> "User";
        };
    }

    private User getAuthenticatedUser(HttpServletRequest request) {
        User user = getOptionalAuthenticatedUser(request);
        if (user == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required.");
        }
        return user;
    }

    private User getOptionalAuthenticatedUser(HttpServletRequest request) {
        return (User) request.getAttribute(AuthInterceptor.AUTHENTICATED_USER);
    }

    private String resolveRequesterName(Ticket ticket, User authenticatedUser) {
        if (authenticatedUser != null) {
            return defaultIfBlank(ticket.getRequesterName(), authenticatedUser.getUsername());
        }

        return ticket.getRequesterName().trim();
    }

    private String resolveRequesterEmail(Ticket ticket, User authenticatedUser) {
        if (authenticatedUser != null) {
            return defaultIfBlank(ticket.getRequesterEmail(), authenticatedUser.getEmail());
        }

        return ticket.getRequesterEmail().trim();
    }

    private User requireOperationsUser(HttpServletRequest request) {
        User user = getAuthenticatedUser(request);
        if (!isOperationsUser(user)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Admin or staff access is required.");
        }

        return user;
    }

    private User requireAssigneeUser(HttpServletRequest request) {
        User user = getAuthenticatedUser(request);
        String role = user.getRole() == null ? "" : user.getRole().trim().toUpperCase();

        if (!ASSIGNEE_ROLE.equals(role)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Assignee access is required.");
        }

        return user;
    }

    private boolean isOperationsUser(User user) {
        String role = user.getRole() == null ? "" : user.getRole().trim().toUpperCase();
        return OPERATIONS_ROLES.contains(role);
    }

    private boolean isAssignedToUser(Ticket ticket, User user) {
        return ticket.getAssignee() != null
                && user.getUsername() != null
                && ticket.getAssignee().trim().equalsIgnoreCase(user.getUsername().trim());
    }
}
