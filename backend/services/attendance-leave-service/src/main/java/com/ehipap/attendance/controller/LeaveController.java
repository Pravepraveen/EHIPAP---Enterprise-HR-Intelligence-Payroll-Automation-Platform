package com.ehipap.attendance.controller;

import com.ehipap.attendance.entity.*;
import com.ehipap.attendance.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/v1/leaves")
@RequiredArgsConstructor
public class LeaveController {

    private final LeaveRequestRepository leaveRequestRepository;
    private final LeaveTypeRepository leaveTypeRepository;
    private final JdbcTemplate jdbcTemplate;

    @GetMapping("/types")
    public ResponseEntity<List<LeaveType>> getLeaveTypes() {
        return ResponseEntity.ok(leaveTypeRepository.findAll());
    }

    @GetMapping
    public ResponseEntity<List<LeaveRequest>> getAll(
            @RequestHeader(value = "X-User-Role", required = false) String role,
            @RequestParam(required = false) String status) {
        requireApproverRole(role);
        if (status != null) return ResponseEntity.ok(leaveRequestRepository.findByStatusOrderByCreatedAtDesc(status));
        return ResponseEntity.ok(leaveRequestRepository.findAll());
    }

    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<List<LeaveRequest>> getByEmployee(
            @PathVariable UUID employeeId,
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @RequestHeader(value = "X-User-Role", required = false) String role) {
        requireOwnEmployeeOrApprover(role, userId, employeeId);
        return ResponseEntity.ok(leaveRequestRepository.findByEmployeeIdOrderByCreatedAtDesc(employeeId));
    }

    @PostMapping
    public ResponseEntity<LeaveRequest> applyLeave(
            @RequestBody LeaveRequest request,
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @RequestHeader(value = "X-User-Role", required = false) String role) {
        if (!isApproverRole(role)) {
            UUID ownEmployeeId = resolveEmployeeIdForUser(userId);
            if (request.getEmployeeId() == null) {
                request.setEmployeeId(ownEmployeeId);
            } else if (!request.getEmployeeId().equals(ownEmployeeId)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Employees may apply leave only for themselves");
            }
        }
        if (request.getEmployeeId() == null || request.getLeaveTypeId() == null
                || request.getStartDate() == null || request.getEndDate() == null
                || request.getTotalDays() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "employeeId, leaveTypeId, startDate, endDate, and totalDays are required");
        }
        if (request.getEndDate().isBefore(request.getStartDate())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "End date must be on or after start date");
        }
        if (request.getTotalDays().signum() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "totalDays must be greater than zero");
        }
        request.setStatus("PENDING");
        return ResponseEntity.status(HttpStatus.CREATED).body(leaveRequestRepository.save(request));
    }

    @PatchMapping("/{id}/approve")
    public ResponseEntity<LeaveRequest> approveLeave(
            @PathVariable UUID id,
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @RequestHeader(value = "X-User-Role", required = false) String role) {
        requireApproverRole(role);
        LeaveRequest lr = leaveRequestRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Leave request not found"));
        lr.setStatus("APPROVED");
        lr.setApprovedBy(userId != null ? UUID.fromString(userId) : null);
        lr.setApprovedAt(LocalDateTime.now());
        return ResponseEntity.ok(leaveRequestRepository.save(lr));
    }

    @PatchMapping("/{id}/reject")
    public ResponseEntity<LeaveRequest> rejectLeave(
            @PathVariable UUID id,
            @RequestHeader(value = "X-User-Role", required = false) String role,
            @RequestBody Map<String, String> body) {
        requireApproverRole(role);
        LeaveRequest lr = leaveRequestRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Leave request not found"));
        lr.setStatus("REJECTED");
        lr.setRejectionReason(body.get("reason"));
        return ResponseEntity.ok(leaveRequestRepository.save(lr));
    }

    private void requireApproverRole(String role) {
        if (!isApproverRole(role)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Only HR Manager or Admin can approve or reject leave");
        }
    }

    private boolean isApproverRole(String role) {
        if (role == null) return false;
        String r = role.toUpperCase();
        return r.equals("SUPER_ADMIN") || r.equals("HR_MANAGER");
    }

    private void requireOwnEmployeeOrApprover(String role, String userId, UUID employeeId) {
        if (isApproverRole(role)) {
            return;
        }
        UUID ownEmployeeId = resolveEmployeeIdForUser(userId);
        if (!ownEmployeeId.equals(employeeId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied: own leave requests only");
        }
    }

    private UUID resolveEmployeeIdForUser(String userId) {
        if (userId == null || userId.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User ID required");
        }
        UUID uid = UUID.fromString(userId);
        List<UUID> employeeIds = jdbcTemplate.query(
                "select id from employees where user_id = ?",
                (rs, rowNum) -> (UUID) rs.getObject("id"),
                uid);
        if (employeeIds.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Employee profile not found for this user");
        }
        return employeeIds.get(0);
    }
}
