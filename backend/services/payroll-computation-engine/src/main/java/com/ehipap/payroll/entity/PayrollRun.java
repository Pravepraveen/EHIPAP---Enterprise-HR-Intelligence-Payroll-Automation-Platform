package com.ehipap.payroll.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "payroll_runs")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class PayrollRun {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private Integer month;

    @Column(nullable = false)
    private Integer year;

    @Column(length = 20)
    private String status = "DRAFT";

    @Column(name = "total_employees")
    private Integer totalEmployees = 0;

    @Column(name = "total_gross", precision = 15, scale = 2)
    private BigDecimal totalGross = BigDecimal.ZERO;

    @Column(name = "total_deductions", precision = 15, scale = 2)
    private BigDecimal totalDeductions = BigDecimal.ZERO;

    @Column(name = "total_net", precision = 15, scale = 2)
    private BigDecimal totalNet = BigDecimal.ZERO;

    @Column(name = "processed_by")
    private UUID processedBy;

    @Column(name = "processed_at")
    private LocalDateTime processedAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
