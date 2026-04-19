package com.umt.smartcampus.dto;

import lombok.Data;

import java.util.List;

@Data
public class FoundItemRecordRequest {
    private String itemName;
    private String description;
    private String foundLocation;
    private List<String> photoUrls;
}
