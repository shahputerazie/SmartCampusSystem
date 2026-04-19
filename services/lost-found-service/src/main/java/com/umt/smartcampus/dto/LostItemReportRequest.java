package com.umt.smartcampus.dto;

import lombok.Data;

import java.util.List;

@Data
public class LostItemReportRequest {
    private String itemName;
    private String description;
    private String lastKnownLocation;
    private List<String> photoUrls;
}
