package com.umt.smartcampus.repositories;

import com.umt.smartcampus.models.LostItemReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LostItemReportRepository extends JpaRepository<LostItemReport, Long> {
    List<LostItemReport> findAllByOrderByCreatedAtDesc();

    List<LostItemReport> findByReporterUserIdOrderByCreatedAtDesc(Long reporterUserId);

    List<LostItemReport> findByStatusInOrderByCreatedAtDesc(List<String> statuses);
}
