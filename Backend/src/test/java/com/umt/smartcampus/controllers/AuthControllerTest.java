package com.umt.smartcampus.controllers;

import com.umt.smartcampus.models.User;
import com.umt.smartcampus.repositories.UserRepository;
import com.umt.smartcampus.security.PasswordService;
import com.umt.smartcampus.security.SessionAuthService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpHeaders;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.Optional;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class AuthControllerTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordService passwordService;

    @Mock
    private SessionAuthService sessionAuthService;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(
                new AuthController(userRepository, passwordService, sessionAuthService)
        ).build();
    }

    @Test
    void loginReturnsTokenForValidCredentials() throws Exception {
        User user = buildUser(10L, "admin", "admin@umt.edu.my", "ADMIN", "stored");

        when(userRepository.findByEmailIgnoreCase("admin")).thenReturn(Optional.empty());
        when(userRepository.findByUsernameIgnoreCase("admin")).thenReturn(Optional.of(user));
        when(passwordService.matches("admin123", "stored")).thenReturn(true);
        when(passwordService.needsRehash("stored")).thenReturn(false);
        when(sessionAuthService.createToken(user)).thenReturn("token-123");

        mockMvc.perform(post("/api/auth/login")
                        .contentType("application/json")
                        .content("""
                                {
                                  "login": "admin",
                                  "password": "admin123"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("token-123"))
                .andExpect(jsonPath("$.username").value("admin"))
                .andExpect(jsonPath("$.role").value("ADMIN"));
    }

    @Test
    void currentUserReturnsUnauthorizedWhenAuthorizationHeaderMissing() throws Exception {
        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void logoutReturnsUnauthorizedWhenBearerTokenMissing() throws Exception {
        mockMvc.perform(post("/api/auth/logout")
                        .header(HttpHeaders.AUTHORIZATION, "Token abc"))
                .andExpect(status().isUnauthorized());
    }

    private User buildUser(Long id, String username, String email, String role, String password) {
        User user = new User();
        user.setId(id);
        user.setUsername(username);
        user.setEmail(email);
        user.setRole(role);
        user.setPassword(password);
        return user;
    }
}
