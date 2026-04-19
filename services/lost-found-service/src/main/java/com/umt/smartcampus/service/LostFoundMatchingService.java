package com.umt.smartcampus.service;

import com.umt.smartcampus.models.FoundItemRecord;
import com.umt.smartcampus.models.LostItemReport;
import com.umt.smartcampus.repositories.LostItemReportRepository;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class LostFoundMatchingService {

    private static final List<String> MATCHABLE_LOST_STATUSES = List.of("OPEN", "MATCHED");

    private final LostItemReportRepository lostItemReportRepository;

    public LostFoundMatchingService(LostItemReportRepository lostItemReportRepository) {
        this.lostItemReportRepository = lostItemReportRepository;
    }

    public Optional<LostItemReport> findBestMatch(FoundItemRecord foundItemRecord) {
        return lostItemReportRepository.findByStatusInOrderByCreatedAtDesc(MATCHABLE_LOST_STATUSES).stream()
                .map(report -> new Candidate(report, score(report, foundItemRecord)))
                .filter(candidate -> candidate.score >= 2)
                .max((left, right) -> Integer.compare(left.score, right.score))
                .map(candidate -> candidate.report);
    }

    private int score(LostItemReport lostItemReport, FoundItemRecord foundItemRecord) {
        int score = 0;

        if (containsEither(lostItemReport.getItemName(), foundItemRecord.getItemName())) {
            score += 2;
        }

        if (hasTokenOverlap(lostItemReport.getDescription(), foundItemRecord.getDescription())) {
            score += 2;
        }

        if (containsEither(lostItemReport.getLastKnownLocation(), foundItemRecord.getFoundLocation())) {
            score += 1;
        }

        return score;
    }

    private boolean hasTokenOverlap(String left, String right) {
        Set<String> leftTokens = tokenize(left);
        Set<String> rightTokens = tokenize(right);

        if (leftTokens.isEmpty() || rightTokens.isEmpty()) {
            return false;
        }

        return leftTokens.stream().anyMatch(rightTokens::contains);
    }

    private Set<String> tokenize(String value) {
        if (value == null || value.isBlank()) {
            return Set.of();
        }

        return Arrays.stream(value.toLowerCase(Locale.ROOT).split("[^a-z0-9]+"))
                .filter(token -> token.length() > 2)
                .collect(Collectors.toSet());
    }

    private boolean containsEither(String left, String right) {
        String normalizedLeft = normalize(left);
        String normalizedRight = normalize(right);

        if (normalizedLeft.isBlank() || normalizedRight.isBlank()) {
            return false;
        }

        return normalizedLeft.contains(normalizedRight) || normalizedRight.contains(normalizedLeft);
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
    }

    private record Candidate(LostItemReport report, int score) {
    }
}
