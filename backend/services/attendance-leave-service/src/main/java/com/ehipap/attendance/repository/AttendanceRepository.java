package com.ehipap.attendance.repository;

import com.ehipap.attendance.entity.Attendance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.*;

@Repository
public interface AttendanceRepository extends JpaRepository<Attendance, UUID> {
    List<Attendance> findByEmployeeIdOrderByAttendanceDateDesc(UUID employeeId);
    Optional<Attendance> findByEmployeeIdAndAttendanceDate(UUID employeeId, LocalDate date);
    List<Attendance> findByAttendanceDateBetweenOrderByAttendanceDateDesc(LocalDate from, LocalDate to);
    List<Attendance> findByEmployeeIdAndAttendanceDateBetween(UUID employeeId, LocalDate from, LocalDate to);
    long countByEmployeeIdAndStatusAndAttendanceDateBetween(UUID employeeId, String status, LocalDate from, LocalDate to);
}
