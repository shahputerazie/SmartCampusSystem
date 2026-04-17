package com.umt.smartcampus.security;

import com.umt.smartcampus.models.User;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
public class AuthInterceptor implements HandlerInterceptor {

    public static final String AUTHENTICATED_USER = "authenticatedUser";

    private final SessionAuthService sessionAuthService;

    public AuthInterceptor(SessionAuthService sessionAuthService) {
        this.sessionAuthService = sessionAuthService;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        if (HttpMethod.OPTIONS.matches(request.getMethod())) {
            return true;
        }

        if (isPublicIdentityEndpoint(request)) {
            return true;
        }

        String header = request.getHeader(HttpHeaders.AUTHORIZATION);
        String token = extractBearerToken(header);

        User user = sessionAuthService.getUserFromToken(token).orElse(null);
        if (user == null) {
            response.sendError(HttpStatus.UNAUTHORIZED.value(), "Authentication required.");
            return false;
        }

        request.setAttribute(AUTHENTICATED_USER, user);
        return true;
    }

    private boolean isPublicIdentityEndpoint(HttpServletRequest request) {
        return HttpMethod.POST.matches(request.getMethod())
                && "/api/auth/login".equals(request.getRequestURI());
    }

    private String extractBearerToken(String header) {
        if (header == null) {
            return null;
        }

        if (!header.startsWith("Bearer ")) {
            return null;
        }

        return header.substring(7).trim();
    }
}
