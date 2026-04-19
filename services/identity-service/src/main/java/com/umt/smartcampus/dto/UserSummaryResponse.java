package com.umt.smartcampus.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class UserSummaryResponse {
    private long total;
    private long admins;
    private long staff;
    private long assignees;
    private long security;
}
