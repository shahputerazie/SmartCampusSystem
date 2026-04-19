package com.umt.smartcampus.models;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Table;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "lost_item_reports")
@Data
public class LostItemReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "reporter_user_id", nullable = false)
    private Long reporterUserId;

    @Column(name = "reporter_name", nullable = false)
    private String reporterName;

    @Column(name = "reporter_email", nullable = false)
    private String reporterEmail;

    @Column(name = "item_name", nullable = false)
    private String itemName;

    @Column(nullable = false, length = 2000)
    private String description;

    @Column(name = "last_known_location", nullable = false)
    private String lastKnownLocation;

    @ElementCollection
    @CollectionTable(name = "lost_item_photos", joinColumns = @JoinColumn(name = "lost_item_id"))
    @Column(name = "photo_url")
    private List<String> photoUrls = new ArrayList<>();

    @Column(nullable = false, length = 32)
    private String status = "OPEN";

    @Column(name = "matched_found_item_id")
    private Long matchedFoundItemId;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
