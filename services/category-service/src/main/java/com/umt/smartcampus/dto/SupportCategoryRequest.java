package com.umt.smartcampus.dto;

import lombok.Data;

@Data
public class SupportCategoryRequest {
    private String name;
    private String department;
    private String serviceLabel;
    private String defaultLocation;
    private String responseTarget;
}
