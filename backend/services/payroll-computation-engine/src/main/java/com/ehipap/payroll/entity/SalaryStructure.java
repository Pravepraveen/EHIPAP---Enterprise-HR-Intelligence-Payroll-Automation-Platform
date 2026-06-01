package com.ehipap.payroll.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.math.BigDecimal;
import java.time.*;
import java.util.UUID;

@Entity
@Table(name = "salary_structures")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class SalaryStructure {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "employee_id", unique = true, nullable = false)
    private UUID employeeId;

    @Column(name = "basic_salary", nullable = false, precision = 15, scale = 2)
    private BigDecimal basicSalary;

    @Column(name = "hra_percent", precision = 5, scale = 2)
    private BigDecimal hraPercent = new BigDecimal("40");

    @Column(name = "da_percent", precision = 5, scale = 2)
    private BigDecimal daPercent = new BigDecimal("10");

    @Column(name = "ta_amount", precision = 10, scale = 2)
    private BigDecimal taAmount = new BigDecimal("1600");

    @Column(name = "medical_allowance", precision = 10, scale = 2)
    private BigDecimal medicalAllowance = new BigDecimal("1250");

    @Column(name = "special_allowance", precision = 10, scale = 2)
    private BigDecimal specialAllowance = BigDecimal.ZERO;

    @Column(name = "pf_employee_percent", precision = 5, scale = 2)
    private BigDecimal pfEmployeePercent = new BigDecimal("12");

    @Column(name = "pf_employer_percent", precision = 5, scale = 2)
    private BigDecimal pfEmployerPercent = new BigDecimal("12");

    @Column(name = "esi_employee_percent", precision = 5, scale = 2)
    private BigDecimal esiEmployeePercent = new BigDecimal("0.75");

    @Column(name = "esi_employer_percent", precision = 5, scale = 2)
    private BigDecimal esiEmployerPercent = new BigDecimal("3.25");

    @Column(name = "professional_tax", precision = 10, scale = 2)
    private BigDecimal professionalTax = new BigDecimal("200");

    @Column(name = "effective_from", nullable = false)
    private LocalDate effectiveFrom;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
