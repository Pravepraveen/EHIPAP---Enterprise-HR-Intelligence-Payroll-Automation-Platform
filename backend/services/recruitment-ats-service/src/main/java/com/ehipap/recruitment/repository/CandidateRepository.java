package com.ehipap.recruitment.repository;

import com.ehipap.recruitment.entity.Candidate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.*;

@Repository
public interface CandidateRepository extends JpaRepository<Candidate, UUID> {
    List<Candidate> findByJobPostingId(UUID jobPostingId);
    List<Candidate> findByStage(String stage);
    List<Candidate> findByJobPostingIdAndStage(UUID jobPostingId, String stage);
    long countByStage(String stage);
    long countByJobPostingId(UUID jobPostingId);
}
