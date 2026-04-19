package com.umt.smartcampus.controllers;

import com.umt.smartcampus.dto.FoundItemRecordRequest;
import com.umt.smartcampus.dto.FoundItemRecordResponse;
import com.umt.smartcampus.dto.LostItemClaimReviewRequest;
import com.umt.smartcampus.dto.LostItemReportRequest;
import com.umt.smartcampus.dto.LostItemReportResponse;
import com.umt.smartcampus.models.FoundItemRecord;
import com.umt.smartcampus.models.LostItemReport;
import com.umt.smartcampus.repositories.FoundItemRecordRepository;
import com.umt.smartcampus.repositories.LostItemReportRepository;
import com.umt.smartcampus.security.AuthenticatedUser;
import com.umt.smartcampus.security.AuthInterceptor;
import com.umt.smartcampus.service.LostFoundMatchingService;
import com.umt.smartcampus.service.NotificationDispatchService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;

@RestController
@RequestMapping("/api/lost-found")
@CrossOrigin(origins = "*")
public class LostFoundController {

    private static final Set<String> OPERATIONS_ROLES = Set.of("ADMIN", "STAFF", "SECURITY");

    private final LostItemReportRepository lostItemReportRepository;
    private final FoundItemRecordRepository foundItemRecordRepository;
    private final LostFoundMatchingService lostFoundMatchingService;
    private final NotificationDispatchService notificationDispatchService;

    public LostFoundController(
            LostItemReportRepository lostItemReportRepository,
            FoundItemRecordRepository foundItemRecordRepository,
            LostFoundMatchingService lostFoundMatchingService,
            NotificationDispatchService notificationDispatchService
    ) {
        this.lostItemReportRepository = lostItemReportRepository;
        this.foundItemRecordRepository = foundItemRecordRepository;
        this.lostFoundMatchingService = lostFoundMatchingService;
        this.notificationDispatchService = notificationDispatchService;
    }

    @GetMapping("/lost")
    public List<LostItemReportResponse> getLostReports(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String status,
            HttpServletRequest request
    ) {
        AuthenticatedUser user = requireAuthenticatedUser(request);
        List<LostItemReport> base = isOperationsUser(user)
                ? lostItemReportRepository.findAllByOrderByCreatedAtDesc()
                : lostItemReportRepository.findByReporterUserIdOrderByCreatedAtDesc(user.getId());

        return base.stream()
                .filter(report -> matchesQuery(report, query))
                .filter(report -> matchesStatus(report.getStatus(), status))
                .map(LostItemReportResponse::from)
                .toList();
    }

    @GetMapping("/lost/mine")
    public List<LostItemReportResponse> getMyLostReports(HttpServletRequest request) {
        AuthenticatedUser user = requireAuthenticatedUser(request);
        return lostItemReportRepository.findByReporterUserIdOrderByCreatedAtDesc(user.getId()).stream()
                .map(LostItemReportResponse::from)
                .toList();
    }

    @GetMapping("/lost/{reportId}")
    public LostItemReportResponse getLostReport(@PathVariable Long reportId, HttpServletRequest request) {
        AuthenticatedUser user = requireAuthenticatedUser(request);
        LostItemReport report = findLostReport(reportId);

        if (!isOperationsUser(user) && !user.getId().equals(report.getReporterUserId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not have access to this report.");
        }

        return LostItemReportResponse.from(report);
    }

    @PostMapping("/lost")
    @ResponseStatus(HttpStatus.CREATED)
    public LostItemReportResponse createLostReport(
            @RequestBody LostItemReportRequest requestBody,
            HttpServletRequest request
    ) {
        AuthenticatedUser user = requireAuthenticatedUser(request);

        LostItemReport report = new LostItemReport();
        report.setReporterUserId(user.getId());
        report.setReporterName(defaultIfBlank(user.getUsername(), "Campus User"));
        report.setReporterEmail(defaultIfBlank(user.getEmail(), "unknown@umt.edu.my"));
        report.setItemName(requireValue(requestBody.getItemName(), "Item name is required."));
        report.setDescription(requireValue(requestBody.getDescription(), "Description is required."));
        report.setLastKnownLocation(requireValue(requestBody.getLastKnownLocation(), "Last known location is required."));
        report.setPhotoUrls(normalizePhotoUrls(requestBody.getPhotoUrls()));
        report.setStatus("OPEN");

        return LostItemReportResponse.from(lostItemReportRepository.save(report));
    }

    @GetMapping("/found")
    public List<FoundItemRecordResponse> getFoundRecords(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String status,
            HttpServletRequest request
    ) {
        requireAuthenticatedUser(request);

        return foundItemRecordRepository.findAllByOrderByCreatedAtDesc().stream()
                .filter(record -> matchesQuery(record, query))
                .filter(record -> matchesStatus(record.getStatus(), status))
                .map(FoundItemRecordResponse::from)
                .toList();
    }

    @GetMapping("/found/{recordId}")
    public FoundItemRecordResponse getFoundRecord(@PathVariable Long recordId, HttpServletRequest request) {
        requireAuthenticatedUser(request);
        return FoundItemRecordResponse.from(findFoundRecord(recordId));
    }

    @PostMapping("/found")
    @ResponseStatus(HttpStatus.CREATED)
    public FoundItemRecordResponse createFoundRecord(
            @RequestBody FoundItemRecordRequest requestBody,
            HttpServletRequest request
    ) {
        AuthenticatedUser user = requireOperationsUser(request);

        FoundItemRecord record = new FoundItemRecord();
        record.setSubmittedByUserId(user.getId());
        record.setSubmittedByName(defaultIfBlank(user.getUsername(), "Security Desk"));
        record.setSubmittedByRole(normalizeRole(user.getRole()));
        record.setItemName(requireValue(requestBody.getItemName(), "Item name is required."));
        record.setDescription(requireValue(requestBody.getDescription(), "Description is required."));
        record.setFoundLocation(requireValue(requestBody.getFoundLocation(), "Found location is required."));
        record.setPhotoUrls(normalizePhotoUrls(requestBody.getPhotoUrls()));
        record.setStatus("AVAILABLE");

        FoundItemRecord saved = foundItemRecordRepository.save(record);
        Optional<LostItemReport> potentialMatch = lostFoundMatchingService.findBestMatch(saved);

        if (potentialMatch.isPresent()) {
            LostItemReport lostItemReport = potentialMatch.get();
            saved.setMatchedLostReportId(lostItemReport.getId());
            foundItemRecordRepository.save(saved);

            lostItemReport.setStatus("MATCHED");
            lostItemReport.setMatchedFoundItemId(saved.getId());
            lostItemReportRepository.save(lostItemReport);

            notificationDispatchService.notifyLostFoundPotentialMatch(lostItemReport, saved);
        }

        return FoundItemRecordResponse.from(saved);
    }

    @PatchMapping("/found/{recordId}/claims/review")
    public FoundItemRecordResponse reviewClaim(
            @PathVariable Long recordId,
            @RequestBody LostItemClaimReviewRequest requestBody,
            HttpServletRequest request
    ) {
        AuthenticatedUser reviewer = requireOperationsUser(request);
        FoundItemRecord foundItemRecord = findFoundRecord(recordId);

        if (requestBody.getLostReportId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "lostReportId is required.");
        }

        LostItemReport lostItemReport = findLostReport(requestBody.getLostReportId());
        String decision = normalizeDecision(requestBody.getDecision());
        String reviewerLabel = defaultIfBlank(reviewer.getUsername(), "Operations Desk") + " (" + normalizeRole(reviewer.getRole()) + ")";

        foundItemRecord.setClaimReviewedAt(LocalDateTime.now());
        foundItemRecord.setClaimReviewedBy(reviewerLabel);
        foundItemRecord.setClaimNote(trimToNull(requestBody.getNote()));

        if ("APPROVE".equals(decision)) {
            foundItemRecord.setStatus("CLAIMED");
            foundItemRecord.setClaimedByUserId(lostItemReport.getReporterUserId());
            foundItemRecord.setMatchedLostReportId(lostItemReport.getId());
            foundItemRecordRepository.save(foundItemRecord);

            lostItemReport.setStatus("CLAIMED");
            lostItemReport.setMatchedFoundItemId(foundItemRecord.getId());
            lostItemReportRepository.save(lostItemReport);

            return FoundItemRecordResponse.from(foundItemRecord);
        }

        foundItemRecord.setStatus("AVAILABLE");
        foundItemRecord.setClaimedByUserId(null);

        if (foundItemRecord.getMatchedLostReportId() != null && foundItemRecord.getMatchedLostReportId().equals(lostItemReport.getId())) {
            foundItemRecord.setMatchedLostReportId(null);
        }

        foundItemRecordRepository.save(foundItemRecord);

        if (lostItemReport.getMatchedFoundItemId() != null && lostItemReport.getMatchedFoundItemId().equals(foundItemRecord.getId())) {
            lostItemReport.setMatchedFoundItemId(null);
            lostItemReport.setStatus("OPEN");
            lostItemReportRepository.save(lostItemReport);
        }

        return FoundItemRecordResponse.from(foundItemRecord);
    }

    private LostItemReport findLostReport(Long reportId) {
        return lostItemReportRepository.findById(reportId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Lost item report not found."));
    }

    private FoundItemRecord findFoundRecord(Long recordId) {
        return foundItemRecordRepository.findById(recordId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Found item record not found."));
    }

    private AuthenticatedUser requireAuthenticatedUser(HttpServletRequest request) {
        AuthenticatedUser user = (AuthenticatedUser) request.getAttribute(AuthInterceptor.AUTHENTICATED_USER);
        if (user == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required.");
        }

        return user;
    }

    private AuthenticatedUser requireOperationsUser(HttpServletRequest request) {
        AuthenticatedUser user = requireAuthenticatedUser(request);
        if (!isOperationsUser(user)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Security, staff, or admin access is required.");
        }

        return user;
    }

    private boolean isOperationsUser(AuthenticatedUser user) {
        return OPERATIONS_ROLES.contains(normalizeRole(user.getRole()));
    }

    private boolean matchesQuery(LostItemReport report, String query) {
        String q = normalizeSearch(query);
        if (q.isBlank()) {
            return true;
        }

        return contains(report.getItemName(), q)
                || contains(report.getDescription(), q)
                || contains(report.getLastKnownLocation(), q)
                || report.getPhotoUrls().stream().anyMatch(photo -> contains(photo, q));
    }

    private boolean matchesQuery(FoundItemRecord record, String query) {
        String q = normalizeSearch(query);
        if (q.isBlank()) {
            return true;
        }

        return contains(record.getItemName(), q)
                || contains(record.getDescription(), q)
                || contains(record.getFoundLocation(), q)
                || record.getPhotoUrls().stream().anyMatch(photo -> contains(photo, q));
    }

    private boolean matchesStatus(String currentStatus, String expectedStatus) {
        if (expectedStatus == null || expectedStatus.isBlank()) {
            return true;
        }

        return normalizeRole(currentStatus).equals(normalizeRole(expectedStatus));
    }

    private String requireValue(String value, String message) {
        if (value == null || value.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
        }

        return value.trim();
    }

    private List<String> normalizePhotoUrls(List<String> photoUrls) {
        if (photoUrls == null) {
            return List.of();
        }

        return photoUrls.stream()
                .filter(value -> value != null && !value.isBlank())
                .map(String::trim)
                .distinct()
                .toList();
    }

    private String normalizeRole(String role) {
        return role == null ? "" : role.trim().toUpperCase(Locale.ROOT);
    }

    private String normalizeDecision(String decision) {
        String normalized = normalizeRole(decision);
        if (!"APPROVE".equals(normalized) && !"REJECT".equals(normalized)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "decision must be APPROVE or REJECT.");
        }

        return normalized;
    }

    private String defaultIfBlank(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value.trim();
    }

    private String normalizeSearch(String query) {
        return query == null ? "" : query.trim().toLowerCase(Locale.ROOT);
    }

    private boolean contains(String source, String query) {
        return source != null && source.toLowerCase(Locale.ROOT).contains(query);
    }

    private String trimToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        return value.trim();
    }
}
