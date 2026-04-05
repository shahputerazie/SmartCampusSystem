package com.umt.smartcampus.dto;

import lombok.Data;

@Data
public class TicketCommentRequest {
    private String message;
    private String authorName;
    private String authorRole;
}
