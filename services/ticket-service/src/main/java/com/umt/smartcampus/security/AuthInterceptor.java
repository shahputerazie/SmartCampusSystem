package com.umt.smartcampus.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
public class AuthInterceptor implements HandlerInterceptor {

    public static final String AUTHENTICATED_USER = "authenticatedUser";

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        if (HttpMethod.OPTIONS.matches(request.getMethod())) {
            return true;
        }

        if (isPublicTicketSubmission(request)) {
            return true;
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
