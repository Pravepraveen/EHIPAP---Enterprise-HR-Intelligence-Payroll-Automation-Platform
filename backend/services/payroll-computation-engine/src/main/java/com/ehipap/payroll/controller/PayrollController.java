package com.ehipap.payroll.controller;

import com.ehipap.payroll.entity.*;
import com.ehipap.payroll.repository.EmployeeRefRepository;
import com.ehipap.payroll.service.PayrollService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.util.*;

@RestController
@RequestMapping("/api/v1/payroll")
@RequiredArgsConstructor
public class PayrollController {

    private static final Set<String> PAYROLL_ADMIN_ROLES = Set.of("SUPER_ADMIN");

    private final PayrollService payrollService;
    private final EmployeeRefRepository employeeRefRepository;

    @GetMapping("/runs")
    public ResponseEntity<List<PayrollRun>> getAllRuns(
            @RequestHeader(value = "X-User-Role", required = false) String role) {
        requirePayrollAdmin(role);
        return ResponseEntity.ok(payrollService.getAllRuns());
    }

    @PostMapping("/process")
    public ResponseEntity<PayrollRun> processPayroll(
            @RequestParam int month,
            @RequestParam int year,
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @RequestHeader(value = "X-User-Role", required = false) String role) {
        requirePayrollAdmin(role);
        UUID uid = userId != null ? UUID.fromString(userId) : null;
        return ResponseEntity.ok(payrollService.processPayroll(month, year, uid));
    }

    @GetMapping("/my/payslips")
    public ResponseEntity<List<Payslip>> getMyPayslips(
            @RequestHeader(value = "X-User-Id", required = false) String userId) {
        UUID employeeId = resolveEmployeeIdForUser(userId);
        return ResponseEntity.ok(payrollService.getPayslipsByEmployee(employeeId));
    }

    @GetMapping("/my/salary")
    public ResponseEntity<SalaryStructure> getMySalary(
            @RequestHeader(value = "X-User-Id", required = false) String userId) {
        UUID employeeId = resolveEmployeeIdForUser(userId);
        return payrollService.getSalaryStructure(employeeId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/payslips/employee/{employeeId}")
    public ResponseEntity<List<Payslip>> getPayslipsByEmployee(
            @PathVariable UUID employeeId,
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @RequestHeader(value = "X-User-Role", required = false) String role) {
        requireOwnEmployeeOrAdmin(role, userId, employeeId);
        return ResponseEntity.ok(payrollService.getPayslipsByEmployee(employeeId));
    }

    @GetMapping("/payslips/run/{runId}")
    public ResponseEntity<List<Payslip>> getPayslipsByRun(
            @PathVariable UUID runId,
            @RequestHeader(value = "X-User-Role", required = false) String role) {
        requirePayrollAdmin(role);
        return ResponseEntity.ok(payrollService.getPayslipsByRun(runId));
    }

    @GetMapping("/payslips/{employeeId}/{year}/{month}")
    public ResponseEntity<Payslip> getPayslip(
            @PathVariable UUID employeeId,
            @PathVariable int year,
            @PathVariable int month,
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @RequestHeader(value = "X-User-Role", required = false) String role) {
        requireOwnEmployeeOrAdmin(role, userId, employeeId);
        return payrollService.getPayslip(employeeId, month, year)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/salary/{employeeId}")
    public ResponseEntity<SalaryStructure> getSalaryStructure(
            @PathVariable UUID employeeId,
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @RequestHeader(value = "X-User-Role", required = false) String role) {
        requireOwnEmployeeOrAdmin(role, userId, employeeId);
        return payrollService.getSalaryStructure(employeeId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/salary")
    public ResponseEntity<SalaryStructure> saveSalaryStructure(
            @RequestBody SalaryStructure ss,
            @RequestHeader(value = "X-User-Role", required = false) String role) {
        requirePayrollAdmin(role);
        return ResponseEntity.ok(payrollService.saveSalaryStructure(ss));
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats(
            @RequestHeader(value = "X-User-Role", required = false) String role) {
        requirePayrollAdmin(role);
        return ResponseEntity.ok(payrollService.getPayrollStats());
    }

    private boolean isPayrollAdmin(String role) {
        return role != null && PAYROLL_ADMIN_ROLES.contains(role.toUpperCase());
    }

    private void requirePayrollAdmin(String role) {
        if (!isPayrollAdmin(role)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Admin payroll access required");
        }
    }

    private UUID resolveEmployeeIdForUser(String userId) {
        if (userId == null || userId.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User ID required");
        }
        return employeeRefRepository.findByUserId(UUID.fromString(userId))
                .map(EmployeeRef::getId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Employee profile not found for this user"));
    }

    private void requireOwnEmployeeOrAdmin(String role, String userId, UUID requestedEmployeeId) {
        if (isPayrollAdmin(role)) {
            return;
        }
        UUID ownEmployeeId = resolveEmployeeIdForUser(userId);
        if (!ownEmployeeId.equals(requestedEmployeeId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied: own payroll only");
        }
    }
}
