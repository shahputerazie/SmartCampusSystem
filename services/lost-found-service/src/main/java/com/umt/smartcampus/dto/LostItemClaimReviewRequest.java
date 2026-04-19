package com.umt.smartcampus.dto;

import lombok.Data;

@Data
public class LostItemClaimReviewRequest {
    private Long lostReportId;
    private String decision;
    private String note;
}
