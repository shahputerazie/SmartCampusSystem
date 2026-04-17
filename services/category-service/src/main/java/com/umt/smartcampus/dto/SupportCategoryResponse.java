package com.umt.smartcampus.dto;

import com.umt.smartcampus.models.SupportCategory;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
public class SupportCategoryResponse {
    private Long id;
    private String name;
    private String department;
    private String serviceLabel;
    private String defaultLocation;
    private String responseTarget;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static SupportCategoryResponse from(SupportCategory category) {
        return new SupportCategoryResponse(
                category.getId(),
                category.getName(),
                category.getDepartment(),
                category.getServiceLabel(),
                category.getDefaultLocation(),
                category.getResponseTarget(),
                category.getCreatedAt(),
                category.getUpdatedAt()
        );
    }
}
