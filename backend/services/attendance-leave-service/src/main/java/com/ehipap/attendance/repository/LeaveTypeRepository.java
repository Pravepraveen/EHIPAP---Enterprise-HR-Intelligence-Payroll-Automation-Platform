package com.ehipap.attendance.repository;

import com.ehipap.attendance.entity.LeaveType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.*;

@Repository
public interface LeaveTypeRepository extends JpaRepository<LeaveType, UUID> {
    List<LeaveType> findByIsActive(boolean isActive);
}
