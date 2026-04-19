package com.umt.smartcampus.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class DepartmentCatalogClient {

    private final HttpClient httpClient;
    private final String departmentServiceBaseUrl;

    public DepartmentCatalogClient(
            HttpClient httpClient,
            @Value("${services.department.base-url:http://localhost:8083}") String departmentServiceBaseUrl
    ) {
        this.httpClient = httpClient;
        this.departmentServiceBaseUrl = trimTrailingSlash(departmentServiceBaseUrl);
    }

    public Optional<DepartmentCategory> findByName(String categoryName) {
        String normalizedCategoryName = categoryName == null ? "" : categoryName.trim();
        if (normalizedCategoryName.isBlank()) {
            return Optional.empty();
        }

        List<DepartmentCategory> categories = fetchAllCategories();
        return categories.stream()
                .filter(category -> normalize(category.name()).equals(normalize(normalizedCategoryName)))
                .findFirst();
    }

    private List<DepartmentCategory> fetchAllCategories() {
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(departmentServiceBaseUrl + "/api/departments"))
                .timeout(Duration.ofSeconds(5))
                .GET()
                .build();

        try {
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != HttpStatus.OK.value()) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Unable to verify department category.");
            }

            return parseCategoryPayload(response.body());
        } catch (ResponseStatusException exception) {
            throw exception;
        } catch (Exception exception) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Unable to verify department category.", exception);
        }
    }

    private String trimTrailingSlash(String value) {
        if (value == null || value.isBlank()) {
            return "http://localhost:8083";
        }

        return value.endsWith("/") ? value.substring(0, value.length() - 1) : value;
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim().toUpperCase(Locale.ROOT);
    }

    private List<DepartmentCategory> parseCategoryPayload(String jsonPayload) {
        if (jsonPayload == null || jsonPayload.isBlank()) {
            return List.of();
        }

        List<DepartmentCategory> categories = new ArrayList<>();
        Matcher objectMatcher = Pattern.compile("\\{[^{}]*}").matcher(jsonPayload);
        while (objectMatcher.find()) {
            String item = objectMatcher.group();
            String name = extractStringField(item, "name");
            if (name.isBlank()) {
                continue;
            }

            categories.add(new DepartmentCategory(name, extractStringField(item, "defaultLocation")));
        }

        return categories;
    }

    private String extractStringField(String jsonObject, String fieldName) {
        Pattern pattern = Pattern.compile("\"" + Pattern.quote(fieldName) + "\"\\s*:\\s*\"([^\"]*)\"");
        Matcher matcher = pattern.matcher(jsonObject);
        if (matcher.find()) {
            return matcher.group(1).trim();
        }
        return "";
    }

    public record DepartmentCategory(
            String name,
            String defaultLocation
    ) {
    }
}
