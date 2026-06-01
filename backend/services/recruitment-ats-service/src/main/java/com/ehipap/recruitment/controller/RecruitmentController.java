package com.ehipap.recruitment.controller;

import com.ehipap.recruitment.entity.*;
import com.ehipap.recruitment.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequiredArgsConstructor
public class RecruitmentController {

    private final JobPostingRepository jobPostingRepository;
    private final CandidateRepository candidateRepository;

    // ─── Job Postings ──────────────────────────────────────────────
    @GetMapping("/api/v1/jobs")
    public ResponseEntity<List<JobPosting>> getAllJobs(@RequestParam(required = false) String status) {
        if (status != null) return ResponseEntity.ok(jobPostingRepository.findByStatus(status));
        return ResponseEntity.ok(jobPostingRepository.findAll());
    }

    @GetMapping("/api/v1/jobs/{id}")
    public ResponseEntity<JobPosting> getJob(@PathVariable UUID id) {
        return jobPostingRepository.findById(id).map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/api/v1/jobs")
    public ResponseEntity<JobPosting> createJob(@RequestBody JobPosting job) {
        return ResponseEntity.status(HttpStatus.CREATED).body(jobPostingRepository.save(job));
    }

    @PutMapping("/api/v1/jobs/{id}")
    public ResponseEntity<JobPosting> updateJob(@PathVariable UUID id, @RequestBody JobPosting req) {
        return jobPostingRepository.findById(id).map(j -> {
            j.setTitle(req.getTitle()); j.setDescription(req.getDescription());
            j.setRequirements(req.getRequirements()); j.setLocation(req.getLocation());
            j.setStatus(req.getStatus()); j.setOpenings(req.getOpenings());
            j.setClosingDate(req.getClosingDate());
            return ResponseEntity.ok(jobPostingRepository.save(j));
        }).orElse(ResponseEntity.notFound().build());
    }

    // ─── Candidates ────────────────────────────────────────────────
    @GetMapping("/api/v1/candidates")
    public ResponseEntity<List<Candidate>> getAllCandidates(
            @RequestParam(required = false) UUID jobId,
            @RequestParam(required = false) String stage) {
        if (jobId != null && stage != null)
            return ResponseEntity.ok(candidateRepository.findByJobPostingIdAndStage(jobId, stage));
        if (jobId != null) return ResponseEntity.ok(candidateRepository.findByJobPostingId(jobId));
        if (stage != null) return ResponseEntity.ok(candidateRepository.findByStage(stage));
        return ResponseEntity.ok(candidateRepository.findAll());
    }

    @GetMapping("/api/v1/candidates/{id}")
    public ResponseEntity<Candidate> getCandidate(@PathVariable UUID id) {
        return candidateRepository.findById(id).map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/api/v1/candidates")
    public ResponseEntity<Candidate> createCandidate(@RequestBody Candidate candidate) {
        return ResponseEntity.status(HttpStatus.CREATED).body(candidateRepository.save(candidate));
    }

    @PatchMapping("/api/v1/candidates/{id}/stage")
    public ResponseEntity<Candidate> updateStage(@PathVariable UUID id, @RequestBody Map<String, String> body) {
        return candidateRepository.findById(id).map(c -> {
            c.setStage(body.get("stage"));
            if (body.containsKey("notes")) c.setNotes(body.get("notes"));
            return ResponseEntity.ok(candidateRepository.save(c));
        }).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/api/v1/jobs/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        return ResponseEntity.ok(Map.of(
                "totalJobs", jobPostingRepository.count(),
                "openJobs", jobPostingRepository.countByStatus("OPEN"),
                "totalCandidates", candidateRepository.count(),
                "appliedCandidates", candidateRepository.countByStage("APPLIED"),
                "offerCandidates", candidateRepository.countByStage("OFFER")
        ));
    }
}
