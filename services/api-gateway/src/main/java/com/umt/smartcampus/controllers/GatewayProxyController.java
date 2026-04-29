package com.umt.smartcampus.controllers;

import com.umt.smartcampus.config.GatewayRoutesProperties;
import com.umt.smartcampus.service.IdentityEnrichmentService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Enumeration;
import java.util.Map;

@RestController
public class GatewayProxyController {

    private static final String HEADER_USER_ID = "X-User-Id";
    private static final String HEADER_USERNAME = "X-Username";
    private static final String HEADER_EMAIL = "X-Email";
    private static final String HEADER_ROLE = "X-Role";
    private static final String HEADER_INTERNAL_GATEWAY_KEY = "X-Internal-Gateway-Key";

    private final HttpClient httpClient;
    private final GatewayRoutesProperties routes;
    private final IdentityEnrichmentService identityEnrichmentService;
    private final String gatewaySharedKey;

    public GatewayProxyController(
            HttpClient httpClient,
            GatewayRoutesProperties routes,
            IdentityEnrichmentService identityEnrichmentService,
            @Value("${gateway.security.shared-key:}") String gatewaySharedKey
    ) {
        this.httpClient = httpClient;
        this.routes = routes;
        this.identityEnrichmentService = identityEnrichmentService;
        this.gatewaySharedKey = gatewaySharedKey == null ? "" : gatewaySharedKey.trim();
    }

    @RequestMapping("/api/**")
    public ResponseEntity<byte[]> proxy(HttpServletRequest request, @RequestBody(required = false) byte[] body) {
        String path = request.getRequestURI();
        String targetBase = resolveTargetBase(path);
        String targetUrl = buildTargetUrl(targetBase, path, request.getQueryString());

        HttpRequest.Builder outboundBuilder = HttpRequest.newBuilder()
                .uri(URI.create(targetUrl))
                .timeout(Duration.ofSeconds(30))
                .method(request.getMethod(), buildBodyPublisher(body));

        copyRequestHeaders(request, outboundBuilder);
        maybeAddIdentityHeaders(request, outboundBuilder, path);

        try {
            HttpResponse<byte[]> upstreamResponse = httpClient.send(outboundBuilder.build(), HttpResponse.BodyHandlers.ofByteArray());
            HttpHeaders responseHeaders = toSpringHeaders(upstreamResponse);
            return new ResponseEntity<>(upstreamResponse.body(), responseHeaders, HttpStatus.valueOf(upstreamResponse.statusCode()));
        } catch (ResponseStatusException exception) {
            throw exception;
        } catch (Exception exception) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Gateway routing failed.", exception);
        }
    }

    private String resolveTargetBase(String path) {
        if (path.startsWith("/api/auth") || path.startsWith("/api/users")) {
            return routes.getIdentityBaseUrl();
        }

        if (path.startsWith("/api/tickets")) {
            return routes.getTicketBaseUrl();
        }

        if (path.startsWith("/api/departments")) {
            return routes.getDepartmentBaseUrl();
        }

        throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Route not found.");
    }

    private void maybeAddIdentityHeaders(HttpServletRequest request, HttpRequest.Builder outboundBuilder, String path) {
        if (!requiresIdentityEnrichment(request, path)) {
            return;
        }

        String authorization = request.getHeader(HttpHeaders.AUTHORIZATION);
        Map<String, String> headers = identityEnrichmentService.getForwardHeaders(authorization);
        headers.forEach(outboundBuilder::header);

        if (!gatewaySharedKey.isBlank()) {
            outboundBuilder.header(HEADER_INTERNAL_GATEWAY_KEY, gatewaySharedKey);
        }
    }

    private boolean requiresIdentityEnrichment(HttpServletRequest request, String path) {
        String method = request.getMethod();

        if (path.startsWith("/api/tickets")) {
            return !("POST".equalsIgnoreCase(method) && "/api/tickets".equals(path));
        }

        if (path.startsWith("/api/departments")) {
            return !"GET".equalsIgnoreCase(method);
        }

        return false;
    }

    private String buildTargetUrl(String targetBase, String path, String query) {
        String sanitizedBase = targetBase == null ? "" : targetBase.replaceAll("/$", "");
        return query == null || query.isBlank()
                ? sanitizedBase + path
                : sanitizedBase + path + "?" + query;
    }

    private HttpRequest.BodyPublisher buildBodyPublisher(byte[] body) {
        if (body == null || body.length == 0) {
            return HttpRequest.BodyPublishers.noBody();
        }

        return HttpRequest.BodyPublishers.ofByteArray(body);
    }

    private void copyRequestHeaders(HttpServletRequest request, HttpRequest.Builder outboundBuilder) {
        Enumeration<String> names = request.getHeaderNames();
        while (names != null && names.hasMoreElements()) {
            String name = names.nextElement();
            if (name == null) {
                continue;
            }

            String lowerName = name.toLowerCase();
            if ("host".equals(lowerName)
                    || "content-length".equals(lowerName)
                    || "connection".equals(lowerName)
                    || HEADER_USER_ID.toLowerCase().equals(lowerName)
                    || HEADER_USERNAME.toLowerCase().equals(lowerName)
                    || HEADER_EMAIL.toLowerCase().equals(lowerName)
                    || HEADER_ROLE.toLowerCase().equals(lowerName)
                    || HEADER_INTERNAL_GATEWAY_KEY.toLowerCase().equals(lowerName)) {
                continue;
            }

            Enumeration<String> values = request.getHeaders(name);
            while (values != null && values.hasMoreElements()) {
                outboundBuilder.header(name, values.nextElement());
            }
        }
    }

    private HttpHeaders toSpringHeaders(HttpResponse<byte[]> upstreamResponse) {
        HttpHeaders headers = new HttpHeaders();
        upstreamResponse.headers().map().forEach((key, values) -> {
            String lower = key.toLowerCase();
            if ("transfer-encoding".equals(lower) || "connection".equals(lower) || "content-length".equals(lower)) {
                return;
            }
            headers.put(key, values);
        });
        return headers;
    }
}
