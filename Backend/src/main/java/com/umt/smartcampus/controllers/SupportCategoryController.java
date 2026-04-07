package com.umt.smartcampus.controllers;

import com.umt.smartcampus.dto.SupportCategoryRequest;
import com.umt.smartcampus.dto.SupportCategoryResponse;
import com.umt.smartcampus.models.SupportCategory;
import com.umt.smartcampus.models.User;
import com.umt.smartcampus.repositories.SupportCategoryRepository;
import com.umt.smartcampus.repositories.TicketRepository;
import com.umt.smartcampus.security.AuthInterceptor;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/api/categories")
@CrossOrigin(origins = "*")
public class SupportCategoryController {
    private static final Set<String> OPERATIONS_ROLES = Set.of("ADMIN", "STAFF");

    private final SupportCategoryRepository supportCategoryRepository;
    private final TicketRepository ticketRepository;

    public SupportCategoryController(
            SupportCategoryRepository supportCategoryRepository,
            TicketRepository ticketRepository
    ) {
        this.supportCategoryRepository = supportCategoryRepository;
        this.ticketRepository = ticketRepository;
    }

    @GetMapping
    public List<SupportCategoryResponse> getCategories() {
        return supportCategoryRepository.findAllByOrderByNameAsc().stream()
                .map(SupportCategoryResponse::from)
                .toList();
    }

    @GetMapping("/{categoryId}")
    public SupportCategoryResponse getCategory(@PathVariable Long categoryId) {
        return SupportCategoryResponse.from(findCategory(categoryId));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public SupportCategoryResponse createCategory(
            @RequestBody SupportCategoryRequest categoryRequest,
            HttpServletRequest request
    ) {
        requireOperationsUser(request);

        String name = requireValue(categoryRequest.getName(), "Department name is required.");
        ensureUniqueName(name, null);

        SupportCategory category = new SupportCategory();
        category.setName(name);
        category.setDepartment(requireValue(categoryRequest.getDepartment(), "Department is required."));
        category.setServiceLabel(requireValue(categoryRequest.getServiceLabel(), "Service label is required."));
        category.setDefaultLocation(requireValue(categoryRequest.getDefaultLocation(), "Default location is required."));
        category.setResponseTarget(requireValue(categoryRequest.getResponseTarget(), "Response target is required."));

        return SupportCategoryResponse.from(supportCategoryRepository.save(category));
    }

    @PutMapping("/{categoryId}")
    public SupportCategoryResponse replaceCategory(
            @PathVariable Long categoryId,
            @RequestBody SupportCategoryRequest categoryRequest,
            HttpServletRequest request
    ) {
        requireOperationsUser(request);
        SupportCategory category = findCategory(categoryId);

        String name = requireValue(categoryRequest.getName(), "Department name is required.");
        ensureUniqueName(name, categoryId);

        category.setName(name);
        category.setDepartment(requireValue(categoryRequest.getDepartment(), "Department is required."));
        category.setServiceLabel(requireValue(categoryRequest.getServiceLabel(), "Service label is required."));
        category.setDefaultLocation(requireValue(categoryRequest.getDefaultLocation(), "Default location is required."));
        category.setResponseTarget(requireValue(categoryRequest.getResponseTarget(), "Response target is required."));

        return SupportCategoryResponse.from(supportCategoryRepository.save(category));
    }

    @DeleteMapping("/{categoryId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteCategory(@PathVariable Long categoryId, HttpServletRequest request) {
        requireOperationsUser(request);
        SupportCategory category = findCategory(categoryId);

        if (ticketRepository.countByCategoryIgnoreCase(category.getName()) > 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Cannot delete a department that is already used by existing tickets."
            );
        }

        supportCategoryRepository.delete(category);
    }

    private SupportCategory findCategory(Long categoryId) {
        return supportCategoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Department not found."));
    }

    private void ensureUniqueName(String name, Long currentCategoryId) {
        supportCategoryRepository.findByNameIgnoreCase(name).ifPresent(existingCategory -> {
            if (!existingCategory.getId().equals(currentCategoryId)) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Department name is already in use.");
            }
        });
    }

    private String requireValue(String value, String message) {
        if (value == null || value.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
        }

        return value.trim();
    }

    private void requireOperationsUser(HttpServletRequest request) {
        User user = (User) request.getAttribute(AuthInterceptor.AUTHENTICATED_USER);
        if (user == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required.");
        }

        String role = user.getRole() == null ? "" : user.getRole().trim().toUpperCase();
        if (!OPERATIONS_ROLES.contains(role)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Admin or staff access is required.");
        }
    }
}
