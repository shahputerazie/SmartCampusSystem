package com.umt.smartcampus.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "gateway.routes")
public class GatewayRoutesProperties {

    private String identityBaseUrl = "http://localhost:8081";
    private String ticketBaseUrl = "http://localhost:8082";
    private String categoryBaseUrl = "http://localhost:8083";

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

    public String getCategoryBaseUrl() {
        return categoryBaseUrl;
    }

    public void setCategoryBaseUrl(String categoryBaseUrl) {
        this.categoryBaseUrl = categoryBaseUrl;
    }
}
