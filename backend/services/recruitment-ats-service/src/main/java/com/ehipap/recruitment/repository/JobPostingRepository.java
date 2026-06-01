package com.ehipap.recruitment.repository;

import com.ehipap.recruitment.entity.JobPosting;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.*;

@Repository
public interface JobPostingRepository extends JpaRepository<JobPosting, UUID> {
    List<JobPosting> findByStatus(String status);
    List<JobPosting> findByDepartmentId(UUID departmentId);
    long countByStatus(String status);
}
