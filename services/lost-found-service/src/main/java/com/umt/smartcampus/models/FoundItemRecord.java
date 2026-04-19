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
@Table(name = "found_item_records")
@Data
public class FoundItemRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "submitted_by_user_id", nullable = false)
    private Long submittedByUserId;

    @Column(name = "submitted_by_name", nullable = false)
    private String submittedByName;

    @Column(name = "submitted_by_role", nullable = false, length = 32)
    private String submittedByRole;

    @Column(name = "item_name", nullable = false)
    private String itemName;

    @Column(nullable = false, length = 2000)
    private String description;

    @Column(name = "found_location", nullable = false)
    private String foundLocation;

    @ElementCollection
    @CollectionTable(name = "found_item_photos", joinColumns = @JoinColumn(name = "found_item_id"))
    @Column(name = "photo_url")
    private List<String> photoUrls = new ArrayList<>();

    @Column(nullable = false, length = 32)
    private String status = "AVAILABLE";

    @Column(name = "matched_lost_report_id")
    private Long matchedLostReportId;

    @Column(name = "claimed_by_user_id")
    private Long claimedByUserId;

    @Column(name = "claim_reviewed_by")
    private String claimReviewedBy;

    @Column(name = "claim_note", length = 1000)
    private String claimNote;

    @Column(name = "claim_reviewed_at")
    private LocalDateTime claimReviewedAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
