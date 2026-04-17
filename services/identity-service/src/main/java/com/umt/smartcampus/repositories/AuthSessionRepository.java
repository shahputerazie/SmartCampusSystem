package com.umt.smartcampus.repositories;

import com.umt.smartcampus.models.AuthSession;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface AuthSessionRepository extends JpaRepository<AuthSession, Long> {
    Optional<AuthSession> findByTokenHash(String tokenHash);

    @Modifying
    @Transactional
    void deleteByTokenHash(String tokenHash);

    @Modifying
    @Transactional
    void deleteByUserId(Long userId);

    @Modifying
    @Transactional
    void deleteByExpiresAtBefore(LocalDateTime cutoff);

    @Modifying
    @Transactional
    @Query(value = """
            delete auth_sessions
            from auth_sessions
            left join users on auth_sessions.user_id = users.id
            where users.id is null
            """, nativeQuery = true)
    void deleteSessionsWithMissingUsers();
}
