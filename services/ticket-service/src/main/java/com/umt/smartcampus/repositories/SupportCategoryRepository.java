package com.umt.smartcampus.repositories;

import com.umt.smartcampus.models.SupportCategory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SupportCategoryRepository extends JpaRepository<SupportCategory, Long> {
    List<SupportCategory> findAllByOrderByNameAsc();

    Optional<SupportCategory> findByNameIgnoreCase(String name);
}
