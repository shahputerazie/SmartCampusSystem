package com.umt.smartcampus.repositories;

import com.umt.smartcampus.models.AuthSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface AuthSessionRepository extends JpaRepository<AuthSession, Long> {
    Optional<AuthSession> findByTokenHash(String tokenHash);

    void deleteByTokenHash(String tokenHash);

    void deleteByUserId(Long userId);

    void deleteByExpiresAtBefore(LocalDateTime cutoff);
}
