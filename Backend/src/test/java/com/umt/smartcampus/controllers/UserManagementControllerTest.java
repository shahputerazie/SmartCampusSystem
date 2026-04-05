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
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;
import java.util.Optional;

import static com.umt.smartcampus.security.AuthInterceptor.AUTHENTICATED_USER;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class UserManagementControllerTest {

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
                new UserManagementController(userRepository, passwordService, sessionAuthService)
        ).build();
    }

    @Test
    void getAllUsersRequiresAdmin() throws Exception {
        mockMvc.perform(get("/api/users")
                        .requestAttr(AUTHENTICATED_USER, buildUser(2L, "staff", "staff@umt.edu.my", "STAFF", "pw")))
                .andExpect(status().isForbidden());
    }

    @Test
    void getAllUsersReturnsSortedUsersForAdmin() throws Exception {
        when(userRepository.findAllByOrderByUsernameAsc()).thenReturn(List.of(
                buildUser(1L, "admin", "admin@umt.edu.my", "ADMIN", "pw"),
                buildUser(2L, "staff", "staff@umt.edu.my", "STAFF", "pw")
        ));

        mockMvc.perform(get("/api/users")
                        .requestAttr(AUTHENTICATED_USER, buildUser(99L, "root", "root@umt.edu.my", "ADMIN", "pw")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].username").value("admin"))
                .andExpect(jsonPath("$[1].username").value("staff"));
    }

    @Test
    void createUserHashesPasswordAndPersistsRole() throws Exception {
        User savedUser = buildUser(8L, "newadmin", "newadmin@umt.edu.my", "ADMIN", "hashed-secret");

        when(userRepository.findByUsernameIgnoreCase("newadmin")).thenReturn(Optional.empty());
        when(userRepository.findByEmailIgnoreCase("newadmin@umt.edu.my")).thenReturn(Optional.empty());
        when(passwordService.hashPassword("secret123")).thenReturn("hashed-secret");
        when(userRepository.save(any(User.class))).thenReturn(savedUser);

        mockMvc.perform(post("/api/users")
                        .requestAttr(AUTHENTICATED_USER, buildUser(1L, "admin", "admin@umt.edu.my", "ADMIN", "pw"))
                        .contentType("application/json")
                        .content("""
                                {
                                  "username": "newadmin",
                                  "email": "newadmin@umt.edu.my",
                                  "password": "secret123",
                                  "role": "admin"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.username").value("newadmin"))
                .andExpect(jsonPath("$.role").value("ADMIN"));
    }

    @Test
    void updateUserRevokesSessionsWhenRoleChanges() throws Exception {
        User existingUser = buildUser(8L, "user1", "user1@umt.edu.my", "USER", "pw");
        User savedUser = buildUser(8L, "user1", "user1@umt.edu.my", "STAFF", "pw");

        when(userRepository.findById(8L)).thenReturn(Optional.of(existingUser));
        when(userRepository.save(any(User.class))).thenReturn(savedUser);

        mockMvc.perform(put("/api/users/8")
                        .requestAttr(AUTHENTICATED_USER, buildUser(1L, "admin", "admin@umt.edu.my", "ADMIN", "pw"))
                        .contentType("application/json")
                        .content("""
                                {
                                  "role": "staff"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("STAFF"));

        verify(sessionAuthService).invalidateAllForUser(8L);
    }

    @Test
    void deleteUserPreventsAdminSelfDeletion() throws Exception {
        mockMvc.perform(delete("/api/users/1")
                        .requestAttr(AUTHENTICATED_USER, buildUser(1L, "admin", "admin@umt.edu.my", "ADMIN", "pw")))
                .andExpect(status().isBadRequest());

        verify(userRepository, never()).delete(any(User.class));
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
