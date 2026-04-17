package com.umt.smartcampus.dto;

import lombok.Data;

@Data
public class UserManagementRequest {
    private String username;
    private String email;
    private String password;
    private String role;
}
