package com.umt.smartcampus.config;

import com.umt.smartcampus.models.User;
import com.umt.smartcampus.repositories.UserRepository;
import com.umt.smartcampus.security.PasswordService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class DataSeeder {

    @Bean
    CommandLineRunner seedUsers(UserRepository userRepository, PasswordService passwordService) {
        return args -> {
            seedUser(userRepository, passwordService, "admin", "admin@umt.edu.my", "admin123", "ADMIN");
            seedUser(userRepository, passwordService, "staff", "staff@umt.edu.my", "staff123", "STAFF");
            seedUser(userRepository, passwordService, "assignee", "assignee@umt.edu.my", "assignee123", "ASSIGNEE");
            seedUser(userRepository, passwordService, "security", "security@umt.edu.my", "security123", "SECURITY");
        };
    }

    private void seedUser(
            UserRepository userRepository,
            PasswordService passwordService,
            String username,
            String email,
            String password,
            String role
    ) {
        boolean userExists = userRepository.findByEmailIgnoreCase(email).isPresent()
                || userRepository.findByUsernameIgnoreCase(username).isPresent();

        if (userExists) {
            return;
        }

        User user = new User();
        user.setUsername(username);
        user.setEmail(email);
        user.setPassword(passwordService.hashPassword(password));
        user.setRole(role);
        userRepository.save(user);
    }
}
