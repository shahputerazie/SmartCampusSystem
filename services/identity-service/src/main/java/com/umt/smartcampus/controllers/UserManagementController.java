package com.umt.smartcampus.controllers;

import com.umt.smartcampus.dto.UserManagementRequest;
import com.umt.smartcampus.dto.UserResponse;
import com.umt.smartcampus.dto.UserSummaryResponse;
import com.umt.smartcampus.models.User;
import com.umt.smartcampus.repositories.UserRepository;
import com.umt.smartcampus.security.AuthInterceptor;
import com.umt.smartcampus.security.PasswordService;
import com.umt.smartcampus.security.SessionAuthService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Arrays;
import java.util.List;
import java.util.Set;
import java.util.regex.Pattern;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*")
public class UserManagementController {

    private static final Set<String> VALID_ROLES = Set.of("ADMIN", "STAFF", "ASSIGNEE", "SECURITY");
    private static final List<String> OPERATIONS_ROLES = List.of("ADMIN", "STAFF");
    private static final Pattern EMAIL_PATTERN =
            Pattern.compile("^[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,}$", Pattern.CASE_INSENSITIVE);
    private static final int MIN_PASSWORD_LENGTH = 8;

    private final UserRepository userRepository;
    private final PasswordService passwordService;
    private final SessionAuthService sessionAuthService;

    public UserManagementController(
            UserRepository userRepository,
            PasswordService passwordService,
            SessionAuthService sessionAuthService
    ) {
        this.userRepository = userRepository;
        this.passwordService = passwordService;
        this.sessionAuthService = sessionAuthService;
    }

    @GetMapping
    public List<UserResponse> getAllUsers(
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String query,
            HttpServletRequest request
    ) {
        requireAdmin(request);
        return findUsers(role, query).stream()
                .map(UserResponse::from)
                .toList();
    }

    @GetMapping("/roles")
    public List<String> getAvailableRoles(HttpServletRequest request) {
        requireAdmin(request);
        return Arrays.asList("ADMIN", "STAFF", "ASSIGNEE", "SECURITY");
    }

    @GetMapping("/summary")
    public UserSummaryResponse getUserSummary(HttpServletRequest request) {
        requireAdmin(request);
        return new UserSummaryResponse(
                userRepository.count(),
                userRepository.countByRole("ADMIN"),
                userRepository.countByRole("STAFF"),
                userRepository.countByRole("ASSIGNEE"),
                userRepository.countByRole("SECURITY")
        );
    }

    @GetMapping("/assignees")
    public List<UserResponse> getAssignableUsers(HttpServletRequest request) {
        requireOperationsUser(request);
        return userRepository.findByRoleIgnoreCaseOrderByUsernameAsc("ASSIGNEE").stream()
                .map(UserResponse::from)
                .toList();
    }

    @GetMapping("/{userId}")
    public UserResponse getUser(@PathVariable Long userId, HttpServletRequest request) {
        requireAdmin(request);
        return UserResponse.from(findUser(userId));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public UserResponse createUser(@RequestBody UserManagementRequest userRequest, HttpServletRequest request) {
        requireAdmin(request);

        String username = requireValue(userRequest.getUsername(), "Username is required.");
        String email = requireValue(userRequest.getEmail(), "Email is required.");
        String password = requireValue(userRequest.getPassword(), "Password is required.");
        String role = normalizeRole(userRequest.getRole());

        validateEmail(email);
        validatePassword(password);
        validateRole(role);
        ensureUniqueUsername(username, null);
        ensureUniqueEmail(email, null);

        User user = new User();
        user.setUsername(username);
        user.setEmail(email);
        user.setPassword(passwordService.hashPassword(password));
        user.setRole(role);

        return UserResponse.from(userRepository.save(user));
    }

    @PutMapping("/{userId}")
    public UserResponse replaceUser(
            @PathVariable Long userId,
            @RequestBody UserManagementRequest userRequest,
            HttpServletRequest request
    ) {
        return updateUser(userId, userRequest, request);
    }

    @PatchMapping("/{userId}")
    public UserResponse updateUser(
            @PathVariable Long userId,
            @RequestBody UserManagementRequest userRequest,
            HttpServletRequest request
    ) {
        User currentUser = requireAdmin(request);
        User user = findUser(userId);

        if (userRequest.getUsername() != null) {
            String username = requireValue(userRequest.getUsername(), "Username cannot be blank.");
            ensureUniqueUsername(username, userId);
            user.setUsername(username);
        }

        if (userRequest.getEmail() != null) {
            String email = requireValue(userRequest.getEmail(), "Email cannot be blank.");
            validateEmail(email);
            ensureUniqueEmail(email, userId);
            user.setEmail(email);
        }

        boolean revokeSessions = false;

        if (userRequest.getPassword() != null && !userRequest.getPassword().isBlank()) {
            String password = userRequest.getPassword().trim();
            validatePassword(password);
            user.setPassword(passwordService.hashPassword(password));
            revokeSessions = true;
        }

        if (userRequest.getRole() != null) {
            String role = normalizeRole(userRequest.getRole());
            validateRole(role);
            if (user.getId().equals(currentUser.getId()) && !"ADMIN".equals(role)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Admin users cannot remove their own admin role.");
            }
            user.setRole(role);
            revokeSessions = true;
        }

        User savedUser = userRepository.save(user);

        if (revokeSessions) {
            sessionAuthService.invalidateAllForUser(savedUser.getId());
        }

        return UserResponse.from(savedUser);
    }

    @DeleteMapping("/{userId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteUser(@PathVariable Long userId, HttpServletRequest request) {
        User currentUser = requireAdmin(request);

        if (currentUser.getId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Admin users cannot delete their own account.");
        }

        User user = findUser(userId);
        sessionAuthService.invalidateAllForUser(user.getId());
        userRepository.delete(user);
    }

    private User requireAdmin(HttpServletRequest request) {
        User user = (User) request.getAttribute(AuthInterceptor.AUTHENTICATED_USER);
        if (user == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required.");
        }

        if (!"ADMIN".equals(normalizeRole(user.getRole()))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Admin access is required.");
        }

        return user;
    }

    private User requireOperationsUser(HttpServletRequest request) {
        User user = (User) request.getAttribute(AuthInterceptor.AUTHENTICATED_USER);
        if (user == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required.");
        }

        String role = normalizeRole(user.getRole());
        if (!OPERATIONS_ROLES.contains(role)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Admin or staff access is required.");
        }

        return user;
    }

    private User findUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found."));
    }

    private List<User> findUsers(String role, String query) {
        String normalizedRole = normalizeRole(role);
        String normalizedQuery = query == null ? "" : query.trim();

        if (!normalizedRole.isBlank()) {
            validateRole(normalizedRole);

            if (!normalizedQuery.isBlank()) {
                return userRepository
                        .findByRoleIgnoreCaseAndUsernameContainingIgnoreCaseOrRoleIgnoreCaseAndEmailContainingIgnoreCaseOrderByUsernameAsc(
                                normalizedRole,
                                normalizedQuery,
                                normalizedRole,
                                normalizedQuery
                        );
            }

            return userRepository.findByRoleIgnoreCaseOrderByUsernameAsc(normalizedRole);
        }

        if (!normalizedQuery.isBlank()) {
            return userRepository.findByUsernameContainingIgnoreCaseOrEmailContainingIgnoreCaseOrderByUsernameAsc(
                    normalizedQuery,
                    normalizedQuery
            );
        }

        return userRepository.findAllByOrderByUsernameAsc();
    }

    private void validateRole(String role) {
        if (!VALID_ROLES.contains(role)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid user role.");
        }
    }

    private void validateEmail(String email) {
        if (!EMAIL_PATTERN.matcher(email).matches()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid email address.");
        }
    }

    private void validatePassword(String password) {
        if (password.length() < MIN_PASSWORD_LENGTH) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Password must be at least " + MIN_PASSWORD_LENGTH + " characters."
            );
        }
    }

    private void ensureUniqueUsername(String username, Long currentUserId) {
        userRepository.findByUsernameIgnoreCase(username).ifPresent(existingUser -> {
            if (!existingUser.getId().equals(currentUserId)) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Username is already in use.");
            }
        });
    }

    private void ensureUniqueEmail(String email, Long currentUserId) {
        userRepository.findByEmailIgnoreCase(email).ifPresent(existingUser -> {
            if (!existingUser.getId().equals(currentUserId)) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Email is already in use.");
            }
        });
    }

    private String requireValue(String value, String message) {
        if (value == null || value.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
        }

        return value.trim();
    }

    private String normalizeRole(String role) {
        return role == null ? "" : role.trim().toUpperCase();
    }
}
