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
            seedUser(userRepository, passwordService, "Ahmad Faris", "ahmad.faris@umt.edu.my", "staff123", "STAFF");
            seedUser(userRepository, passwordService, "Nur Aisyah", "nur.aisyah@umt.edu.my", "staffops123", "STAFF");
            seedUser(userRepository, passwordService, "Muhammad Izzat", "muhammad.izzat@umt.edu.my", "staffops223", "STAFF");
            seedUser(userRepository, passwordService, "Siti Hawa", "siti.hawa@umt.edu.my", "assignee123", "ASSIGNEE");
            seedUser(userRepository, passwordService, "Aiman Hakim", "aiman.hakim@umt.edu.my", "assignee223", "ASSIGNEE");
            seedUser(userRepository, passwordService, "Nur Amalina", "nur.amalina@umt.edu.my", "assignee323", "ASSIGNEE");
            seedUser(userRepository, passwordService, "Faiz Danial", "faiz.danial@umt.edu.my", "assignee423", "ASSIGNEE");
            seedUser(userRepository, passwordService, "Izz Syafiq", "izz.syafiq@umt.edu.my", "assignee523", "ASSIGNEE");
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
