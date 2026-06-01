package com.ehipap.performance.repository;

import com.ehipap.performance.entity.PerformanceCycle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.*;

@Repository
public interface PerformanceCycleRepository extends JpaRepository<PerformanceCycle, UUID> {
    List<PerformanceCycle> findByStatus(String status);
}
