package com.ehipap.performance.controller;

import com.ehipap.performance.entity.*;
import com.ehipap.performance.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/v1/performance")
@RequiredArgsConstructor
public class PerformanceController {

    private final PerformanceReviewRepository reviewRepository;
    private final PerformanceCycleRepository cycleRepository;

    @GetMapping("/cycles")
    public ResponseEntity<List<PerformanceCycle>> getCycles() {
        return ResponseEntity.ok(cycleRepository.findAll());
    }

    @PostMapping("/cycles")
    public ResponseEntity<PerformanceCycle> createCycle(@RequestBody PerformanceCycle cycle) {
        return ResponseEntity.status(HttpStatus.CREATED).body(cycleRepository.save(cycle));
    }

    @GetMapping("/reviews")
    public ResponseEntity<List<PerformanceReview>> getReviews(
            @RequestParam(required = false) UUID employeeId,
            @RequestParam(required = false) UUID cycleId,
            @RequestParam(required = false) String status) {
        if (employeeId != null) return ResponseEntity.ok(reviewRepository.findByEmployeeId(employeeId));
        if (cycleId != null) return ResponseEntity.ok(reviewRepository.findByCycleId(cycleId));
        if (status != null) return ResponseEntity.ok(reviewRepository.findByStatus(status));
        return ResponseEntity.ok(reviewRepository.findAll());
    }

    @PostMapping("/reviews")
    public ResponseEntity<PerformanceReview> createReview(@RequestBody PerformanceReview review) {
        return ResponseEntity.status(HttpStatus.CREATED).body(reviewRepository.save(review));
    }

    @PutMapping("/reviews/{id}")
    public ResponseEntity<PerformanceReview> updateReview(
            @PathVariable UUID id, @RequestBody PerformanceReview req) {
        return reviewRepository.findById(id).map(r -> {
            r.setSelfRating(req.getSelfRating());
            r.setManagerRating(req.getManagerRating());
            r.setFinalRating(req.getFinalRating());
            r.setStrengths(req.getStrengths());
            r.setImprovements(req.getImprovements());
            r.setComments(req.getComments());
            r.setGoalsAchieved(req.getGoalsAchieved());
            r.setTotalGoals(req.getTotalGoals());
            if ("SUBMITTED".equals(req.getStatus())) r.setSubmittedAt(LocalDateTime.now());
            r.setStatus(req.getStatus());
            return ResponseEntity.ok(reviewRepository.save(r));
        }).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        return ResponseEntity.ok(Map.of(
                "totalReviews", reviewRepository.count(),
                "pendingReviews", reviewRepository.findByStatus("PENDING").size(),
                "completedReviews", reviewRepository.findByStatus("COMPLETED").size(),
                "activeCycles", cycleRepository.findByStatus("ACTIVE").size()
        ));
    }
}
