package com.ehipap.analytics.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/v1/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final JdbcTemplate jdbcTemplate;

    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> getDashboard() {
        Map<String, Object> data = new LinkedHashMap<>();

        // Employee stats
        Long totalEmp = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM employees", Long.class);
        Long activeEmp = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM employees WHERE status='ACTIVE'", Long.class);
        data.put("totalEmployees", totalEmp);
        data.put("activeEmployees", activeEmp);

        // Department breakdown
        List<Map<String, Object>> deptStats = jdbcTemplate.queryForList(
            "SELECT d.name, COUNT(e.id) as count FROM departments d " +
            "LEFT JOIN employees e ON e.department_id = d.id AND e.status='ACTIVE' " +
            "GROUP BY d.name ORDER BY count DESC");
        data.put("employeesByDepartment", deptStats);

        // Payroll stats
        List<Map<String, Object>> payrollStats = jdbcTemplate.queryForList(
            "SELECT month, year, total_net, total_employees FROM payroll_runs " +
            "WHERE status='PROCESSED' ORDER BY year DESC, month DESC LIMIT 6");
        data.put("payrollTrend", payrollStats);

        // Attendance stats (last 7 days)
        List<Map<String, Object>> attendanceStats = jdbcTemplate.queryForList(
            "SELECT attendance_date, COUNT(*) FILTER(WHERE status='PRESENT') as present, " +
            "COUNT(*) FILTER(WHERE status='ABSENT') as absent " +
            "FROM attendance WHERE attendance_date >= CURRENT_DATE - INTERVAL '7 days' " +
            "GROUP BY attendance_date ORDER BY attendance_date");
        data.put("attendanceTrend", attendanceStats);

        // Leave stats
        Long pendingLeaves = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM leave_requests WHERE status='PENDING'", Long.class);
        data.put("pendingLeaves", pendingLeaves);

        // Recruitment stats
        Long openJobs = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM job_postings WHERE status='OPEN'", Long.class);
        Long totalCandidates = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM candidates", Long.class);
        data.put("openJobs", openJobs);
        data.put("totalCandidates", totalCandidates);

        // Headcount trend (last 6 months)
        List<Map<String, Object>> headcountTrend = jdbcTemplate.queryForList(
            "SELECT TO_CHAR(joining_date, 'YYYY-MM') as month, COUNT(*) as count " +
            "FROM employees WHERE joining_date >= CURRENT_DATE - INTERVAL '6 months' " +
            "GROUP BY TO_CHAR(joining_date, 'YYYY-MM') ORDER BY month");
        data.put("headcountTrend", headcountTrend);

        return ResponseEntity.ok(data);
    }

    @GetMapping("/payroll-summary")
    public ResponseEntity<List<Map<String, Object>>> getPayrollSummary() {
        List<Map<String, Object>> result = jdbcTemplate.queryForList(
            "SELECT month, year, total_employees, total_gross, total_deductions, total_net, status " +
            "FROM payroll_runs ORDER BY year DESC, month DESC LIMIT 12");
        return ResponseEntity.ok(result);
    }

    @GetMapping("/headcount")
    public ResponseEntity<Map<String, Object>> getHeadcount() {
        Map<String, Object> data = new LinkedHashMap<>();
        List<Map<String, Object>> byDept = jdbcTemplate.queryForList(
            "SELECT d.name as department, COUNT(e.id) as count, " +
            "AVG(e.basic_salary) as avg_salary " +
            "FROM departments d LEFT JOIN employees e ON e.department_id = d.id AND e.status='ACTIVE' " +
            "GROUP BY d.name ORDER BY count DESC");
        data.put("byDepartment", byDept);

        List<Map<String, Object>> byType = jdbcTemplate.queryForList(
            "SELECT employment_type, COUNT(*) as count FROM employees WHERE status='ACTIVE' " +
            "GROUP BY employment_type");
        data.put("byEmploymentType", byType);

        List<Map<String, Object>> byGender = jdbcTemplate.queryForList(
            "SELECT COALESCE(gender, 'Not Specified') as gender, COUNT(*) as count " +
            "FROM employees WHERE status='ACTIVE' GROUP BY gender");
        data.put("byGender", byGender);

        return ResponseEntity.ok(data);
    }

    @GetMapping("/attendance-report")
    public ResponseEntity<List<Map<String, Object>>> getAttendanceReport(
            @RequestParam(defaultValue = "30") int days) {
        List<Map<String, Object>> result = jdbcTemplate.queryForList(
            "SELECT attendance_date, " +
            "COUNT(*) FILTER(WHERE status='PRESENT') as present, " +
            "COUNT(*) FILTER(WHERE status='ABSENT') as absent, " +
            "COUNT(*) FILTER(WHERE status='HALF_DAY') as half_day, " +
            "AVG(work_hours) as avg_hours " +
            "FROM attendance WHERE attendance_date >= CURRENT_DATE - INTERVAL '" + days + " days' " +
            "GROUP BY attendance_date ORDER BY attendance_date DESC");
        return ResponseEntity.ok(result);
    }
}
