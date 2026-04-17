package com.umt.smartcampus.security;

import com.umt.smartcampus.models.AuthSession;
import com.umt.smartcampus.models.User;
import com.umt.smartcampus.repositories.AuthSessionRepository;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Service
public class SessionAuthService {

    private static final Duration TOKEN_TTL = Duration.ofHours(12);
    private final AuthSessionRepository authSessionRepository;

    public SessionAuthService(AuthSessionRepository authSessionRepository) {
        this.authSessionRepository = authSessionRepository;
    }

    public String createToken(User user) {
        authSessionRepository.deleteSessionsWithMissingUsers();
        authSessionRepository.deleteByExpiresAtBefore(LocalDateTime.now());

        String token = UUID.randomUUID() + "." + UUID.randomUUID();

        AuthSession session = new AuthSession();
        session.setUser(user);
        session.setTokenHash(hashToken(token));
        session.setExpiresAt(LocalDateTime.now().plus(TOKEN_TTL));
        authSessionRepository.save(session);

        return token;
    }

    public Optional<User> getUserFromToken(String token) {
        if (token == null || token.isBlank()) {
            return Optional.empty();
        }

        authSessionRepository.deleteSessionsWithMissingUsers();
        authSessionRepository.deleteByExpiresAtBefore(LocalDateTime.now());

        Optional<AuthSession> sessionOptional = authSessionRepository.findByTokenHash(hashToken(token));
        if (sessionOptional.isEmpty()) {
            return Optional.empty();
        }

        AuthSession session = sessionOptional.get();
        if (session.getExpiresAt().isBefore(LocalDateTime.now())) {
            authSessionRepository.delete(session);
            return Optional.empty();
        }

        return Optional.of(session.getUser());
    }

    public void invalidate(String token) {
        if (token != null && !token.isBlank()) {
            authSessionRepository.deleteByTokenHash(hashToken(token));
        }
    }

    public void invalidateAllForUser(Long userId) {
        if (userId != null) {
            authSessionRepository.deleteByUserId(userId);
        }
    }

    private String hashToken(String token) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                    .digest(token.getBytes(StandardCharsets.UTF_8));
            StringBuilder builder = new StringBuilder(digest.length * 2);
            for (byte value : digest) {
                builder.append(String.format("%02x", value));
            }
            return builder.toString();
        } catch (Exception exception) {
            throw new IllegalStateException("Unable to hash session token.", exception);
        }
    }
}
