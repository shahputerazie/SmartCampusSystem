package com.umt.smartcampus.dto;

import com.umt.smartcampus.models.Comment;
import com.umt.smartcampus.models.Ticket;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@AllArgsConstructor
public class TicketResponse {
    private Long id;
    private String title;
    private String description;
    private String category;
    private String status;
    private String assignee;
    private String location;
    private String requesterName;
    private String requesterEmail;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<TicketCommentResponse> comments;

    public static TicketResponse from(Ticket ticket, List<Comment> comments) {
        return new TicketResponse(
                ticket.getId(),
                ticket.getTitle(),
                ticket.getDescription(),
                ticket.getCategory(),
                ticket.getStatus(),
                ticket.getAssignee(),
                ticket.getLocation(),
                ticket.getUser() == null ? ticket.getRequesterName() : ticket.getUser().getUsername(),
                ticket.getUser() == null ? ticket.getRequesterEmail() : ticket.getUser().getEmail(),
                ticket.getCreatedAt(),
                ticket.getUpdatedAt(),
                comments.stream().map(TicketCommentResponse::from).toList()
        );
    }
}
