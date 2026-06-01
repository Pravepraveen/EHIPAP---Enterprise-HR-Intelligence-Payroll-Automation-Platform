package com.ehipap.performance.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.math.BigDecimal;
import java.time.*;
import java.util.UUID;

@Entity
@Table(name = "performance_reviews")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class PerformanceReview {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "cycle_id")
    private UUID cycleId;

    @Column(name = "employee_id", nullable = false)
    private UUID employeeId;

    @Column(name = "reviewer_id")
    private UUID reviewerId;

    @Column(name = "self_rating", precision = 3, scale = 1)
    private BigDecimal selfRating;

    @Column(name = "manager_rating", precision = 3, scale = 1)
    private BigDecimal managerRating;

    @Column(name = "final_rating", precision = 3, scale = 1)
    private BigDecimal finalRating;

    @Column(name = "goals_achieved")
    private Integer goalsAchieved = 0;

    @Column(name = "total_goals")
    private Integer totalGoals = 0;

    @Column(columnDefinition = "TEXT")
    private String strengths;

    @Column(columnDefinition = "TEXT")
    private String improvements;

    @Column(columnDefinition = "TEXT")
    private String comments;

    @Column(length = 20)
    private String status = "PENDING";

    @Column(name = "submitted_at")
    private LocalDateTime submittedAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
