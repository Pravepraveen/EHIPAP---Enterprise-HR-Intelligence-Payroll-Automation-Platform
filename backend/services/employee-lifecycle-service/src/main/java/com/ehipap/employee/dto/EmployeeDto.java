package com.ehipap.employee.dto;

import lombok.*;
import java.math.BigDecimal;
import java.time.*;
import java.util.UUID;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class EmployeeDto {
    private UUID id;
    private String employeeCode;
    private String firstName;
    private String lastName;
    private String fullName;
    private String email;
    private String phone;
    private LocalDate dateOfBirth;
    private String gender;
    private String address;
    private String city;
    private String state;
    private String country;
    private String pincode;
    private UUID departmentId;
    private String departmentName;
    private String designation;
    private String employmentType;
    private LocalDate joiningDate;
    private LocalDate confirmationDate;
    private String status;
    private UUID managerId;
    private String managerName;
    private BigDecimal basicSalary;
    private String panNumber;
    private String bankAccount;
    private String bankName;
    private String ifscCode;
    private String profilePhotoUrl;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    /** Set only when a new login account is created with the employee */
    private String loginUsername;
    private String initialPassword;
}
