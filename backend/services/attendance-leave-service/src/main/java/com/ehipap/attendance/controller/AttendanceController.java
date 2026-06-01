package com.ehipap.attendance.controller;

import com.ehipap.attendance.entity.*;
import com.ehipap.attendance.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/v1/attendance")
@RequiredArgsConstructor
public class AttendanceController {

    private final AttendanceRepository attendanceRepository;

    @GetMapping
    public ResponseEntity<List<Attendance>> getAll(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        if (from != null && to != null) {
            return ResponseEntity.ok(attendanceRepository.findByAttendanceDateBetweenOrderByAttendanceDateDesc(from, to));
        }
        return ResponseEntity.ok(attendanceRepository.findAll());
    }

    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<List<Attendance>> getByEmployee(@PathVariable UUID employeeId) {
        return ResponseEntity.ok(attendanceRepository.findByEmployeeIdOrderByAttendanceDateDesc(employeeId));
    }

    @PostMapping("/checkin")
    public ResponseEntity<Attendance> checkIn(@RequestBody Map<String, String> body) {
        UUID employeeId = UUID.fromString(body.get("employeeId"));
        LocalDate today = LocalDate.now();
        Optional<Attendance> existing = attendanceRepository.findByEmployeeIdAndAttendanceDate(employeeId, today);
        if (existing.isPresent()) {
            return ResponseEntity.ok(existing.get());
        }
        Attendance att = Attendance.builder()
                .employeeId(employeeId).attendanceDate(today)
                .checkIn(LocalDateTime.now()).status("PRESENT")
                .location(body.getOrDefault("location", "Office")).build();
        return ResponseEntity.status(HttpStatus.CREATED).body(attendanceRepository.save(att));
    }

    @PostMapping("/checkout")
    public ResponseEntity<Attendance> checkOut(@RequestBody Map<String, String> body) {
        UUID employeeId = UUID.fromString(body.get("employeeId"));
        LocalDate today = LocalDate.now();
        Attendance att = attendanceRepository.findByEmployeeIdAndAttendanceDate(employeeId, today)
                .orElseThrow(() -> new RuntimeException("No check-in found for today"));
        att.setCheckOut(LocalDateTime.now());
        if (att.getCheckIn() != null) {
            long minutes = java.time.Duration.between(att.getCheckIn(), att.getCheckOut()).toMinutes();
            att.setWorkHours(new java.math.BigDecimal(minutes).divide(new java.math.BigDecimal(60), 2, java.math.RoundingMode.HALF_UP));
        }
        return ResponseEntity.ok(attendanceRepository.save(att));
    }

    @PostMapping
    public ResponseEntity<Attendance> markAttendance(@RequestBody Attendance attendance) {
        return ResponseEntity.status(HttpStatus.CREATED).body(attendanceRepository.save(attendance));
    }

    @GetMapping("/stats/{employeeId}")
    public ResponseEntity<Map<String, Object>> getStats(@PathVariable UUID employeeId) {
        LocalDate monthStart = LocalDate.now().withDayOfMonth(1);
        LocalDate today = LocalDate.now();
        long present = attendanceRepository.countByEmployeeIdAndStatusAndAttendanceDateBetween(
                employeeId, "PRESENT", monthStart, today);
        long absent = attendanceRepository.countByEmployeeIdAndStatusAndAttendanceDateBetween(
                employeeId, "ABSENT", monthStart, today);
        return ResponseEntity.ok(Map.of("present", present, "absent", absent, "month", today.getMonthValue()));
    }
}
