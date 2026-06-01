package com.ehipap.employee.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "employees")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Employee {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id")
    private UUID userId;

    @Column(name = "employee_code", unique = true, nullable = false, length = 20)
    private String employeeCode;

    @Column(name = "first_name", nullable = false, length = 100)
    private String firstName;

    @Column(name = "last_name", nullable = false, length = 100)
    private String lastName;

    @Column(unique = true, nullable = false, length = 255)
    private String email;

    @Column(length = 20)
    private String phone;

    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;

    @Column(length = 10)
    private String gender;

    private String address;
    private String city;
    private String state;

    @Column(length = 100)
    private String country = "India";

    @Column(length = 10)
    private String pincode;

    @Column(name = "department_id")
    private UUID departmentId;

    @Column(length = 100)
    private String designation;

    @Column(name = "employment_type", length = 50)
    private String employmentType = "FULL_TIME";

    @Column(name = "joining_date", nullable = false)
    private LocalDate joiningDate;

    @Column(name = "confirmation_date")
    private LocalDate confirmationDate;

    @Column(name = "exit_date")
    private LocalDate exitDate;

    @Column(length = 20)
    private String status = "ACTIVE";

    @Column(name = "manager_id")
    private UUID managerId;

    @Column(name = "basic_salary", precision = 15, scale = 2)
    private BigDecimal basicSalary = BigDecimal.ZERO;

    @Column(name = "pan_number", length = 20)
    private String panNumber;

    @Column(name = "aadhar_number", length = 20)
    private String aadharNumber;

    @Column(name = "bank_account", length = 30)
    private String bankAccount;

    @Column(name = "bank_name", length = 100)
    private String bankName;

    @Column(name = "ifsc_code", length = 20)
    private String ifscCode;

    @Column(name = "profile_photo_url", length = 500)
    private String profilePhotoUrl;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
