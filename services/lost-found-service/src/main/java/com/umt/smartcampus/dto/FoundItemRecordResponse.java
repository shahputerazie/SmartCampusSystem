package com.umt.smartcampus.dto;

import com.umt.smartcampus.models.FoundItemRecord;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@AllArgsConstructor
public class FoundItemRecordResponse {
    private Long id;
    private Long submittedByUserId;
    private String submittedByName;
    private String submittedByRole;
    private String itemName;
    private String description;
    private String foundLocation;
    private List<String> photoUrls;
    private String status;
    private Long matchedLostReportId;
    private Long claimedByUserId;
    private String claimReviewedBy;
    private String claimNote;
    private LocalDateTime claimReviewedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static FoundItemRecordResponse from(FoundItemRecord record) {
        return new FoundItemRecordResponse(
                record.getId(),
                record.getSubmittedByUserId(),
                record.getSubmittedByName(),
                record.getSubmittedByRole(),
                record.getItemName(),
                record.getDescription(),
                record.getFoundLocation(),
                record.getPhotoUrls(),
                record.getStatus(),
                record.getMatchedLostReportId(),
                record.getClaimedByUserId(),
                record.getClaimReviewedBy(),
                record.getClaimNote(),
                record.getClaimReviewedAt(),
                record.getCreatedAt(),
                record.getUpdatedAt()
        );
    }
}
