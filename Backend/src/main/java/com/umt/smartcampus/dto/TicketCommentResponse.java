package com.umt.smartcampus.dto;

import com.umt.smartcampus.models.Comment;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
public class TicketCommentResponse {
    private Long id;
    private String author;
    private String role;
    private String message;
    private LocalDateTime createdAt;

    public static TicketCommentResponse from(Comment comment) {
        return new TicketCommentResponse(
                comment.getId(),
                comment.getAuthorName(),
                comment.getAuthorRole(),
                comment.getMessage(),
                comment.getCreatedAt()
        );
    }
}
