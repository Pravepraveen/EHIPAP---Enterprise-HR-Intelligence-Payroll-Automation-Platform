package com.ehipap.payroll.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "payslips")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Payslip {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "payroll_run_id")
    private UUID payrollRunId;

    @Column(name = "employee_id", nullable = false)
    private UUID employeeId;

    @Column(nullable = false)
    private Integer month;

    @Column(nullable = false)
    private Integer year;

    @Column(name = "working_days")
    private Integer workingDays = 26;

    @Column(name = "present_days", precision = 5, scale = 2)
    private BigDecimal presentDays = new BigDecimal("26");

    @Column(name = "basic_salary", precision = 15, scale = 2)
    private BigDecimal basicSalary = BigDecimal.ZERO;

    @Column(precision = 15, scale = 2)
    private BigDecimal hra = BigDecimal.ZERO;

    @Column(precision = 15, scale = 2)
    private BigDecimal da = BigDecimal.ZERO;

    @Column(precision = 15, scale = 2)
    private BigDecimal ta = BigDecimal.ZERO;

    @Column(name = "medical_allowance", precision = 15, scale = 2)
    private BigDecimal medicalAllowance = BigDecimal.ZERO;

    @Column(name = "special_allowance", precision = 15, scale = 2)
    private BigDecimal specialAllowance = BigDecimal.ZERO;

    @Column(name = "gross_salary", precision = 15, scale = 2)
    private BigDecimal grossSalary = BigDecimal.ZERO;

    @Column(name = "pf_employee", precision = 15, scale = 2)
    private BigDecimal pfEmployee = BigDecimal.ZERO;

    @Column(name = "pf_employer", precision = 15, scale = 2)
    private BigDecimal pfEmployer = BigDecimal.ZERO;

    @Column(name = "esi_employee", precision = 15, scale = 2)
    private BigDecimal esiEmployee = BigDecimal.ZERO;

    @Column(name = "esi_employer", precision = 15, scale = 2)
    private BigDecimal esiEmployer = BigDecimal.ZERO;

    @Column(name = "professional_tax", precision = 15, scale = 2)
    private BigDecimal professionalTax = BigDecimal.ZERO;

    @Column(name = "income_tax", precision = 15, scale = 2)
    private BigDecimal incomeTax = BigDecimal.ZERO;

    @Column(name = "total_deductions", precision = 15, scale = 2)
    private BigDecimal totalDeductions = BigDecimal.ZERO;

    @Column(name = "net_salary", precision = 15, scale = 2)
    private BigDecimal netSalary = BigDecimal.ZERO;

    @Column(name = "payslip_url", length = 500)
    private String payslipUrl;

    @Column(length = 20)
    private String status = "GENERATED";

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
