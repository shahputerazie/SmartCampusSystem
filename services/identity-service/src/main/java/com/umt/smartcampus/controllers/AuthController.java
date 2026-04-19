package com.umt.smartcampus.controllers;

import com.umt.smartcampus.dto.AuthResponse;
import com.umt.smartcampus.dto.LoginRequest;
import com.umt.smartcampus.models.User;
import com.umt.smartcampus.repositories.UserRepository;
import com.umt.smartcampus.security.AuthInterceptor;
import com.umt.smartcampus.security.PasswordService;
import com.umt.smartcampus.security.SessionAuthService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;
import java.util.Set;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    private static final Set<String> ALLOWED_ROLES = Set.of("ADMIN", "STAFF", "ASSIGNEE", "SECURITY");

    private final UserRepository userRepository;
    private final PasswordService passwordService;
    private final SessionAuthService sessionAuthService;

    public AuthController(UserRepository userRepository, PasswordService passwordService, SessionAuthService sessionAuthService) {
        this.userRepository = userRepository;
        this.passwordService = passwordService;
        this.sessionAuthService = sessionAuthService;
    }

    @PostMapping("/login")
    public AuthResponse login(@RequestBody LoginRequest request) {
        if (request.getLogin() == null || request.getLogin().isBlank() ||
                request.getPassword() == null || request.getPassword().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Login and password are required.");
        }

        String loginValue = request.getLogin().trim();
        User user = findUser(loginValue)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials."));

        if (!passwordService.matches(request.getPassword(), user.getPassword())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials.");
        }

        if (passwordService.needsRehash(user.getPassword())) {
            user.setPassword(passwordService.hashPassword(request.getPassword()));
            user = userRepository.save(user);
        }

        String normalizedRole = normalizeRole(user.getRole());
        if (!ALLOWED_ROLES.contains(normalizedRole)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "This account role is not allowed to sign in.");
        }

        user.setRole(normalizedRole);
        String token = sessionAuthService.createToken(user);
        return toAuthResponse(token, user);
    }

    @GetMapping("/me")
    public AuthResponse currentUser(
            HttpServletRequest request,
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorizationHeader
    ) {
        User user = (User) request.getAttribute(AuthInterceptor.AUTHENTICATED_USER);
        if (user == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required.");
        }

        return toAuthResponse(extractBearerToken(authorizationHeader), user);
    }

    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void logout(@RequestHeader(HttpHeaders.AUTHORIZATION) String authorizationHeader) {
        sessionAuthService.invalidate(extractBearerToken(authorizationHeader));
    }

    private Optional<User> findUser(String loginValue) {
        Optional<User> byEmail = userRepository.findByEmailIgnoreCase(loginValue);
        if (byEmail.isPresent()) {
            return byEmail;
        }

        return userRepository.findByUsernameIgnoreCase(loginValue);
    }

    private String normalizeRole(String role) {
        return role == null ? "" : role.trim().toUpperCase();
    }

    private String extractBearerToken(String header) {
        if (header == null || !header.startsWith("Bearer ")) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required.");
        }

        return header.substring(7).trim();
    }

    private AuthResponse toAuthResponse(String token, User user) {
        return new AuthResponse(
                token,
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                normalizeRole(user.getRole())
        );
    }
}
