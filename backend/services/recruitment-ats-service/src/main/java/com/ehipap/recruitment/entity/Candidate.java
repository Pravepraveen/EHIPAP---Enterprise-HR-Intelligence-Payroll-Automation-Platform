package com.ehipap.recruitment.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.math.BigDecimal;
import java.time.*;
import java.util.UUID;

@Entity
@Table(name = "candidates")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Candidate {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "job_posting_id")
    private UUID jobPostingId;

    @Column(name = "first_name", nullable = false, length = 100)
    private String firstName;

    @Column(name = "last_name", nullable = false, length = 100)
    private String lastName;

    @Column(nullable = false, length = 255)
    private String email;

    @Column(length = 20)
    private String phone;

    @Column(name = "resume_url", length = 500)
    private String resumeUrl;

    @Column(name = "current_company", length = 200)
    private String currentCompany;

    @Column(name = "current_designation", length = 200)
    private String currentDesignation;

    @Column(name = "experience_years", precision = 4, scale = 1)
    private BigDecimal experienceYears;

    @Column(name = "current_salary", precision = 15, scale = 2)
    private BigDecimal currentSalary;

    @Column(name = "expected_salary", precision = 15, scale = 2)
    private BigDecimal expectedSalary;

    @Column(length = 50)
    private String stage = "APPLIED";

    @Column(length = 20)
    private String status = "ACTIVE";

    @Column(columnDefinition = "TEXT")
    private String notes;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
