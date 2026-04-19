package com.umt.smartcampus.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "gateway.routes")
public class GatewayRoutesProperties {

    private String identityBaseUrl = "http://localhost:8081";
    private String ticketBaseUrl = "http://localhost:8082";
    private String departmentBaseUrl = "http://localhost:8083";
    private String lostFoundBaseUrl = "http://localhost:8084";

    public String getIdentityBaseUrl() {
        return identityBaseUrl;
    }

    public void setIdentityBaseUrl(String identityBaseUrl) {
        this.identityBaseUrl = identityBaseUrl;
    }

    public String getTicketBaseUrl() {
        return ticketBaseUrl;
    }

    public void setTicketBaseUrl(String ticketBaseUrl) {
        this.ticketBaseUrl = ticketBaseUrl;
    }

    public String getDepartmentBaseUrl() {
        return departmentBaseUrl;
    }

    public void setDepartmentBaseUrl(String departmentBaseUrl) {
        this.departmentBaseUrl = departmentBaseUrl;
    }

    public String getLostFoundBaseUrl() {
        return lostFoundBaseUrl;
    }

    public void setLostFoundBaseUrl(String lostFoundBaseUrl) {
        this.lostFoundBaseUrl = lostFoundBaseUrl;
    }
}
