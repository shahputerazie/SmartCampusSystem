package com.umt.smartcampus.dto;

import com.umt.smartcampus.models.LostItemReport;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@AllArgsConstructor
public class LostItemReportResponse {
    private Long id;
    private Long reporterUserId;
    private String reporterName;
    private String reporterEmail;
    private String itemName;
    private String description;
    private String lastKnownLocation;
    private List<String> photoUrls;
    private String status;
    private Long matchedFoundItemId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static LostItemReportResponse from(LostItemReport report) {
        return new LostItemReportResponse(
                report.getId(),
                report.getReporterUserId(),
                report.getReporterName(),
                report.getReporterEmail(),
                report.getItemName(),
                report.getDescription(),
                report.getLastKnownLocation(),
                report.getPhotoUrls(),
                report.getStatus(),
                report.getMatchedFoundItemId(),
                report.getCreatedAt(),
                report.getUpdatedAt()
        );
    }
}
