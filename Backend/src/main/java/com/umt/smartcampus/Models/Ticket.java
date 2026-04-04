package com.scss.smartcampus.models;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "tickets")
@Data
public class Ticket {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;
    private String description;
    private String category;
    private String status = "OPEN";

    // Links to the User table
    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    // Automatically records when the ticket was created
    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;
}