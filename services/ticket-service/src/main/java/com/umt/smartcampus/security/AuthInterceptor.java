package com.umt.smartcampus.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
public class AuthInterceptor implements HandlerInterceptor {

    public static final String AUTHENTICATED_USER = "authenticatedUser";
    private static final String INTERNAL_GATEWAY_KEY_HEADER = "X-Internal-Gateway-Key";

    private final String gatewaySharedKey;

    public AuthInterceptor(@Value("${security.gateway-shared-key:}") String gatewaySharedKey) {
        this.gatewaySharedKey = gatewaySharedKey == null ? "" : gatewaySharedKey.trim();
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        if (HttpMethod.OPTIONS.matches(request.getMethod())) {
            return true;
        }

        if (isPublicTicketSubmission(request)) {
            return true;
        }

        if (!gatewaySharedKey.isBlank()) {
            String inboundGatewayKey = request.getHeader(INTERNAL_GATEWAY_KEY_HEADER);
            if (!gatewaySharedKey.equals(inboundGatewayKey)) {
                response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Gateway authorization is required.");
                return false;
            }
        }

        String userIdHeader = request.getHeader("X-User-Id");
        String username = request.getHeader("X-Username");
        String email = request.getHeader("X-Email");
        String role = request.getHeader("X-Role");

        if (userIdHeader == null || username == null || email == null || role == null) {
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Authentication headers are required.");
            return false;
        }

        Long userId;
        try {
            userId = Long.parseLong(userIdHeader);
        } catch (NumberFormatException exception) {
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Invalid authentication headers.");
            return false;
        }

        request.setAttribute(AUTHENTICATED_USER, new AuthenticatedUser(userId, username, email, role));
        return true;
    }

    private boolean isPublicTicketSubmission(HttpServletRequest request) {
        return HttpMethod.POST.matches(request.getMethod()) && "/api/tickets".equals(request.getRequestURI());
    }
}
