package com.ehipap.performance.repository;

import com.ehipap.performance.entity.PerformanceReview;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.*;

@Repository
public interface PerformanceReviewRepository extends JpaRepository<PerformanceReview, UUID> {
    List<PerformanceReview> findByEmployeeId(UUID employeeId);
    List<PerformanceReview> findByCycleId(UUID cycleId);
    List<PerformanceReview> findByStatus(String status);
}
