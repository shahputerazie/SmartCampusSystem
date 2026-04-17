package com.umt.smartcampus.service;

import com.umt.smartcampus.config.GatewayRoutesProperties;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.HashMap;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class IdentityEnrichmentService {

    private final HttpClient httpClient;
    private final GatewayRoutesProperties routes;

    public IdentityEnrichmentService(HttpClient httpClient, GatewayRoutesProperties routes) {
        this.httpClient = httpClient;
        this.routes = routes;
    }

    public Map<String, String> getForwardHeaders(String authorizationHeader) {
        if (authorizationHeader == null || !authorizationHeader.startsWith("Bearer ")) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required.");
        }

        String baseUrl = trimTrailingSlash(routes.getIdentityBaseUrl());
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(baseUrl + "/api/auth/me"))
                .timeout(Duration.ofSeconds(5))
                .header(HttpHeaders.AUTHORIZATION, authorizationHeader)
                .GET()
                .build();

        try {
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != HttpStatus.OK.value()) {
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required.");
            }

            String responseBody = response.body();
            String userId = extractJsonField(responseBody, "userId");
            String username = extractJsonField(responseBody, "username");
            String email = extractJsonField(responseBody, "email");
            String role = extractJsonField(responseBody, "role");

            Map<String, String> headers = new HashMap<>();
            headers.put("X-User-Id", userId);
            headers.put("X-Username", username);
            headers.put("X-Email", email);
            headers.put("X-Role", role);
            return headers;
        } catch (ResponseStatusException exception) {
            throw exception;
        } catch (Exception exception) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Unable to verify authentication.", exception);
        }
    }

    private String trimTrailingSlash(String value) {
        if (value == null || value.isBlank()) {
            return "";
        }

        return value.endsWith("/") ? value.substring(0, value.length() - 1) : value;
    }

    private String extractJsonField(String json, String fieldName) {
        Pattern quotedPattern = Pattern.compile("\"" + fieldName + "\"\\s*:\\s*\"([^\"]*)\"");
        Matcher quotedMatcher = quotedPattern.matcher(json);
        if (quotedMatcher.find()) {
            return quotedMatcher.group(1);
        }

        Pattern numberPattern = Pattern.compile("\"" + fieldName + "\"\\s*:\\s*(\\d+)");
        Matcher numberMatcher = numberPattern.matcher(json);
        if (numberMatcher.find()) {
            return numberMatcher.group(1);
        }

        throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required.");
    }
}
