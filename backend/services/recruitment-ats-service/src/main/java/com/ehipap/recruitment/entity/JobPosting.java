package com.ehipap.recruitment.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.math.BigDecimal;
import java.time.*;
import java.util.UUID;

@Entity
@Table(name = "job_postings")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class JobPosting {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(name = "department_id")
    private UUID departmentId;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(columnDefinition = "TEXT")
    private String requirements;

    @Column(length = 200)
    private String location;

    @Column(name = "employment_type", length = 50)
    private String employmentType;

    @Column(name = "experience_min")
    private Integer experienceMin = 0;

    @Column(name = "experience_max")
    private Integer experienceMax = 10;

    @Column(name = "salary_min", precision = 15, scale = 2)
    private BigDecimal salaryMin;

    @Column(name = "salary_max", precision = 15, scale = 2)
    private BigDecimal salaryMax;

    private Integer openings = 1;

    @Column(length = 20)
    private String status = "OPEN";

    @Column(name = "posted_by")
    private UUID postedBy;

    @Column(name = "closing_date")
    private LocalDate closingDate;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
