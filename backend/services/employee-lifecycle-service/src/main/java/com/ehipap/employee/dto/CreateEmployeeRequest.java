package com.ehipap.employee.dto;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
public class CreateEmployeeRequest {
    @NotBlank private String firstName;
    @NotBlank private String lastName;
    @NotBlank @Email private String email;
    private String phone;
    private LocalDate dateOfBirth;
    private String gender;
    private String address;
    private String city;
    private String state;
    private String country = "India";
    private String pincode;
    @NotNull private UUID departmentId;
    @NotBlank private String designation;
    private String employmentType = "FULL_TIME";
    @NotNull private LocalDate joiningDate;
    private UUID managerId;
    @DecimalMin("0.0") private BigDecimal basicSalary = BigDecimal.ZERO;
    private String panNumber;
    private String bankAccount;
    private String bankName;
    private String ifscCode;
    /** Login username for the new employee (optional — generated from email if blank) */
    @Size(min = 3, max = 50)
    private String username;
    /** Login password for the new employee (min 8 chars — required for employee login) */
    @Size(min = 8, max = 100)
    private String password;
}
