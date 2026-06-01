package com.ehipap.attendance.repository;

import com.ehipap.attendance.entity.LeaveRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.*;

@Repository
public interface LeaveRequestRepository extends JpaRepository<LeaveRequest, UUID> {
    List<LeaveRequest> findByEmployeeIdOrderByCreatedAtDesc(UUID employeeId);
    List<LeaveRequest> findByStatusOrderByCreatedAtDesc(String status);
    List<LeaveRequest> findByEmployeeIdAndStatus(UUID employeeId, String status);
}
