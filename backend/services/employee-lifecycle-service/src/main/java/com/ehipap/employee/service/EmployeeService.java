package com.ehipap.employee.service;

import com.ehipap.employee.client.AuthRegistrationClient;
import com.ehipap.employee.dto.*;
import com.ehipap.employee.entity.*;
import com.ehipap.employee.repository.*;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.annotation.*;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EmployeeService {
    private static final Logger log = LoggerFactory.getLogger(EmployeeService.class);

    private final EmployeeRepository employeeRepository;
    private final DepartmentRepository departmentRepository;
    private final AuthRegistrationClient authRegistrationClient;

    @Transactional
    public EmployeeDto createEmployee(CreateEmployeeRequest req) {
        if (employeeRepository.findByEmail(req.getEmail()).isPresent()) {
            throw new RuntimeException("Employee email already exists");
        }
        if (req.getPassword() == null || req.getPassword().length() < 8) {
            throw new RuntimeException("Password is required (minimum 8 characters) for employee login");
        }
        long count = employeeRepository.count();
        String code = String.format("EMP%03d", count + 101);

        Employee emp = Employee.builder()
                .employeeCode(code)
                .firstName(req.getFirstName()).lastName(req.getLastName())
                .email(req.getEmail()).phone(req.getPhone())
                .dateOfBirth(req.getDateOfBirth()).gender(req.getGender())
                .address(req.getAddress()).city(req.getCity()).state(req.getState())
                .country(req.getCountry() != null ? req.getCountry() : "India")
                .pincode(req.getPincode()).departmentId(req.getDepartmentId())
                .designation(req.getDesignation())
                .employmentType(req.getEmploymentType() != null ? req.getEmploymentType() : "FULL_TIME")
                .joiningDate(req.getJoiningDate()).managerId(req.getManagerId())
                .basicSalary(req.getBasicSalary()).panNumber(req.getPanNumber())
                .bankAccount(req.getBankAccount()).bankName(req.getBankName())
                .ifscCode(req.getIfscCode()).status("ACTIVE").build();

        emp = employeeRepository.save(emp);

        String tempPassword = req.getPassword();
        String base = (req.getUsername() != null && !req.getUsername().isBlank())
                ? req.getUsername().trim().toLowerCase().replaceAll("[^a-z0-9.]", "")
                : buildUsername(req);
        String username = base;
        UUID userId = null;
        RuntimeException lastError = null;
        for (int i = 0; i < 5; i++) {
            username = i == 0 ? base : base + i;
            try {
                userId = authRegistrationClient.registerEmployeeUser(username, req.getEmail(), tempPassword);
                break;
            } catch (RuntimeException ex) {
                lastError = ex;
                if (ex.getMessage() == null || !ex.getMessage().toLowerCase().contains("username")) {
                    throw ex;
                }
                if (i == 4) {
                    throw lastError;
                }
            }
        }
        if (userId == null) {
            throw lastError != null ? lastError : new RuntimeException("Failed to create login account");
        }
        emp.setUserId(userId);
        emp = employeeRepository.save(emp);

        log.info("Created employee {} with login username {}", emp.getEmployeeCode(), username);
        EmployeeDto dto = toDto(emp);
        dto.setLoginUsername(username);
        dto.setInitialPassword(tempPassword);
        return dto;
    }

    private String buildUsername(CreateEmployeeRequest req) {
        String base = req.getEmail().contains("@")
                ? req.getEmail().substring(0, req.getEmail().indexOf('@'))
                : req.getFirstName() + "." + req.getLastName();
        base = base.toLowerCase().replaceAll("[^a-z0-9.]", "");
        if (base.length() < 3) {
            base = (req.getFirstName() + req.getLastName()).toLowerCase().replaceAll("[^a-z0-9]", "");
        }
        if (base.length() < 3) {
            base = "emp" + System.currentTimeMillis() % 100000;
        }
        return base;
    }

    @Cacheable(value = "employees", key = "#id")
    public EmployeeDto getEmployee(UUID id) {
        return toDto(employeeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Employee not found: " + id)));
    }

    public EmployeeDto getEmployeeByUserId(UUID userId) {
        return toDto(employeeRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Employee profile not found for user")));
    }

    public Page<EmployeeDto> searchEmployees(String search, String status, UUID deptId, Pageable pageable) {
        return employeeRepository.searchEmployees(search, status, deptId, pageable).map(this::toDto);
    }

    public List<EmployeeDto> getAllActive() {
        return employeeRepository.findByStatus("ACTIVE").stream().map(this::toDto).collect(Collectors.toList());
    }

    @Transactional
    @CacheEvict(value = "employees", key = "#id")
    public EmployeeDto updateEmployee(UUID id, CreateEmployeeRequest req) {
        Employee emp = employeeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Employee not found: " + id));
        emp.setFirstName(req.getFirstName()); emp.setLastName(req.getLastName());
        emp.setPhone(req.getPhone()); emp.setDateOfBirth(req.getDateOfBirth());
        emp.setGender(req.getGender()); emp.setAddress(req.getAddress());
        emp.setCity(req.getCity()); emp.setState(req.getState());
        emp.setPincode(req.getPincode()); emp.setDepartmentId(req.getDepartmentId());
        emp.setDesignation(req.getDesignation()); emp.setManagerId(req.getManagerId());
        emp.setBasicSalary(req.getBasicSalary()); emp.setPanNumber(req.getPanNumber());
        emp.setBankAccount(req.getBankAccount()); emp.setBankName(req.getBankName());
        emp.setIfscCode(req.getIfscCode());
        return toDto(employeeRepository.save(emp));
    }

    @Transactional
    @CacheEvict(value = "employees", key = "#id")
    public void terminateEmployee(UUID id, LocalDate exitDate) {
        Employee emp = employeeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Employee not found: " + id));
        emp.setStatus("TERMINATED");
        emp.setExitDate(exitDate != null ? exitDate : LocalDate.now());
        employeeRepository.save(emp);
    }

    public Map<String, Object> getStats() {
        return Map.of(
                "totalEmployees", employeeRepository.count(),
                "activeEmployees", employeeRepository.countByStatus("ACTIVE"),
                "terminatedEmployees", employeeRepository.countByStatus("TERMINATED"),
                "totalDepartments", departmentRepository.count()
        );
    }

    private EmployeeDto toDto(Employee e) {
        String deptName = e.getDepartmentId() != null
                ? departmentRepository.findById(e.getDepartmentId()).map(Department::getName).orElse(null) : null;
        String managerName = e.getManagerId() != null
                ? employeeRepository.findById(e.getManagerId())
                    .map(m -> m.getFirstName() + " " + m.getLastName()).orElse(null) : null;
        return EmployeeDto.builder()
                .id(e.getId()).employeeCode(e.getEmployeeCode())
                .firstName(e.getFirstName()).lastName(e.getLastName())
                .fullName(e.getFirstName() + " " + e.getLastName())
                .email(e.getEmail()).phone(e.getPhone())
                .dateOfBirth(e.getDateOfBirth()).gender(e.getGender())
                .address(e.getAddress()).city(e.getCity()).state(e.getState())
                .country(e.getCountry()).pincode(e.getPincode())
                .departmentId(e.getDepartmentId()).departmentName(deptName)
                .designation(e.getDesignation()).employmentType(e.getEmploymentType())
                .joiningDate(e.getJoiningDate()).confirmationDate(e.getConfirmationDate())
                .status(e.getStatus()).managerId(e.getManagerId()).managerName(managerName)
                .basicSalary(e.getBasicSalary()).panNumber(e.getPanNumber())
                .bankAccount(e.getBankAccount()).bankName(e.getBankName())
                .ifscCode(e.getIfscCode()).profilePhotoUrl(e.getProfilePhotoUrl())
                .createdAt(e.getCreatedAt()).updatedAt(e.getUpdatedAt()).build();
    }
}
