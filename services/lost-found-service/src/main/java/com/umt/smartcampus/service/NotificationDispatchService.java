package com.umt.smartcampus.service;

import com.umt.smartcampus.models.FoundItemRecord;
import com.umt.smartcampus.models.LostItemReport;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

@Service
public class NotificationDispatchService {

    private static final Logger LOGGER = LoggerFactory.getLogger(NotificationDispatchService.class);

    private final HttpClient httpClient;
    private final String notificationsBaseUrl;

    public NotificationDispatchService(
            HttpClient httpClient,
            @Value("${notifications.base-url:}") String notificationsBaseUrl
    ) {
        this.httpClient = httpClient;
        this.notificationsBaseUrl = notificationsBaseUrl == null ? "" : notificationsBaseUrl.trim();
    }

    public void notifyLostFoundPotentialMatch(LostItemReport lostItemReport, FoundItemRecord foundItemRecord) {
        if (notificationsBaseUrl.isBlank()) {
            return;
        }

        String payload = "{" +
                "\"type\":\"LOST_FOUND_MATCH\"," +
                "\"lostReportId\":" + lostItemReport.getId() + "," +
                "\"foundItemId\":" + foundItemRecord.getId() + "," +
                "\"recipientUserId\":" + lostItemReport.getReporterUserId() + "," +
                "\"recipientEmail\":\"" + escapeJson(lostItemReport.getReporterEmail()) + "\"," +
                "\"message\":\"A potential found-item match is available for your lost report.\"" +
                "}";

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(trimTrailingSlash(notificationsBaseUrl) + "/api/notifications/lost-found-match"))
                .timeout(Duration.ofSeconds(5))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(payload))
                .build();

        try {
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() >= 400) {
                LOGGER.warn("Lost/found notification call returned status {}", response.statusCode());
            }
        } catch (Exception exception) {
            LOGGER.warn("Lost/found notification call failed: {}", exception.getMessage());
        }
    }

    private String trimTrailingSlash(String value) {
        return value.endsWith("/") ? value.substring(0, value.length() - 1) : value;
    }

    private String escapeJson(String value) {
        if (value == null) {
            return "";
        }

        return value.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}
