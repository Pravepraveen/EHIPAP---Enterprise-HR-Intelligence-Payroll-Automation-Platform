package com.ehipap.attendance.entity;

import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;

@Entity
@Table(name = "leave_types")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class LeaveType {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(unique = true, nullable = false, length = 20)
    private String code;

    @Column(name = "max_days_per_year")
    private Integer maxDaysPerYear = 0;

    @Column(name = "is_paid")
    private boolean isPaid = true;

    @Column(name = "carry_forward")
    private boolean carryForward = false;

    @Column(name = "is_active")
    private boolean isActive = true;
}
