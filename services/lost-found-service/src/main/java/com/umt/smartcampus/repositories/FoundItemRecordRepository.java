package com.umt.smartcampus.repositories;

import com.umt.smartcampus.models.FoundItemRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FoundItemRecordRepository extends JpaRepository<FoundItemRecord, Long> {
    List<FoundItemRecord> findAllByOrderByCreatedAtDesc();

    List<FoundItemRecord> findByStatusInOrderByCreatedAtDesc(List<String> statuses);
}
