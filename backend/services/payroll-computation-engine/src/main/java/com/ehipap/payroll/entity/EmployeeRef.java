package com.ehipap.payroll.entity;

import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;

@Entity
@Table(name = "employees")
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeRef {
    @Id
    private UUID id;

    @Column(name = "user_id")
    private UUID userId;
}
