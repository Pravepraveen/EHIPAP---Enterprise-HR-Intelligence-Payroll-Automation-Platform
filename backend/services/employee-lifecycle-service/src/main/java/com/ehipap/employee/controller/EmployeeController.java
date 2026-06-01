package com.ehipap.employee.controller;

import com.ehipap.employee.dto.*;
import com.ehipap.employee.service.EmployeeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.time.LocalDate;
import java.util.*;

@RestController
@RequestMapping("/api/v1/employees")
@RequiredArgsConstructor
public class EmployeeController {

    private final EmployeeService employeeService;

    @PostMapping
    public ResponseEntity<EmployeeDto> create(
            @Valid @RequestBody CreateEmployeeRequest req,
            @RequestHeader(value = "X-User-Role", required = false) String role) {
        requireEmployeeManager(role);
        return ResponseEntity.status(HttpStatus.CREATED).body(employeeService.createEmployee(req));
    }

    @GetMapping("/me")
    public ResponseEntity<EmployeeDto> getMe(
            @RequestHeader(value = "X-User-Id", required = false) String userId) {
        if (userId == null || userId.isBlank()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(employeeService.getEmployeeByUserId(UUID.fromString(userId)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<EmployeeDto> get(
            @PathVariable UUID id,
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @RequestHeader(value = "X-User-Role", required = false) String role) {
        requireOwnEmployeeOrManager(userId, role, id);
        return ResponseEntity.ok(employeeService.getEmployee(id));
    }

    @GetMapping
    public ResponseEntity<Page<EmployeeDto>> search(
            @RequestHeader(value = "X-User-Role", required = false) String role,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) UUID departmentId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        requireEmployeeManager(role);
        String q = (search == null || search.isBlank()) ? "" : search.trim();
        String st = (status == null || status.isBlank()) ? "" : status.trim();
        Sort sort = sortDir.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        return ResponseEntity.ok(employeeService.searchEmployees(q, st, departmentId,
                PageRequest.of(page, size, sort)));
    }

    @GetMapping("/active")
    public ResponseEntity<List<EmployeeDto>> getAllActive(
            @RequestHeader(value = "X-User-Role", required = false) String role) {
        requireEmployeeManager(role);
        return ResponseEntity.ok(employeeService.getAllActive());
    }

    @PutMapping("/{id}")
    public ResponseEntity<EmployeeDto> update(
            @PathVariable UUID id,
            @Valid @RequestBody CreateEmployeeRequest req,
            @RequestHeader(value = "X-User-Role", required = false) String role) {
        requireEmployeeManager(role);
        return ResponseEntity.ok(employeeService.updateEmployee(id, req));
    }

    @PatchMapping("/{id}/terminate")
    public ResponseEntity<Map<String, String>> terminate(@PathVariable UUID id,
            @RequestHeader(value = "X-User-Role", required = false) String role,
            @RequestParam(required = false) String exitDate) {
        requireEmployeeManager(role);
        employeeService.terminateEmployee(id, exitDate != null ? LocalDate.parse(exitDate) : null);
        return ResponseEntity.ok(Map.of("message", "Employee terminated successfully"));
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> stats(
            @RequestHeader(value = "X-User-Role", required = false) String role) {
        requireEmployeeManager(role);
        return ResponseEntity.ok(employeeService.getStats());
    }

    private boolean canManageEmployees(String role) {
        if (role == null) return false;
        String r = role.toUpperCase();
        return r.equals("SUPER_ADMIN") || r.equals("HR_MANAGER");
    }

    private void requireEmployeeManager(String role) {
        if (!canManageEmployees(role)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Employee management access required");
        }
    }

    private void requireOwnEmployeeOrManager(String userId, String role, UUID employeeId) {
        if (canManageEmployees(role)) {
            return;
        }
        if (userId == null || userId.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User ID required");
        }
        UUID ownEmployeeId = employeeService.getEmployeeByUserId(UUID.fromString(userId)).getId();
        if (!ownEmployeeId.equals(employeeId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied: own employee profile only");
        }
    }
}
