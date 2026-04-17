package com.umt.smartcampus.repositories;

import com.umt.smartcampus.models.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    List<User> findAllByOrderByUsernameAsc();

    List<User> findByRoleIgnoreCaseOrderByUsernameAsc(String role);

    List<User> findByUsernameContainingIgnoreCaseOrEmailContainingIgnoreCaseOrderByUsernameAsc(String usernameQuery, String emailQuery);

    List<User> findByRoleIgnoreCaseAndUsernameContainingIgnoreCaseOrRoleIgnoreCaseAndEmailContainingIgnoreCaseOrderByUsernameAsc(
            String firstRole,
            String usernameQuery,
            String secondRole,
            String emailQuery
    );

    Optional<User> findByEmailIgnoreCase(String email);

    Optional<User> findByUsernameIgnoreCase(String username);

    boolean existsByEmailIgnoreCase(String email);

    boolean existsByUsernameIgnoreCase(String username);

    long countByRole(String role);
}
