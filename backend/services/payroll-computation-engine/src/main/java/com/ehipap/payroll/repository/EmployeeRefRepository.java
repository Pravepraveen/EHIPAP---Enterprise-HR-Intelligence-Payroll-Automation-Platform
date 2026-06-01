package com.ehipap.payroll.repository;

import com.ehipap.payroll.entity.EmployeeRef;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EmployeeRefRepository extends JpaRepository<EmployeeRef, UUID> {
    Optional<EmployeeRef> findByUserId(UUID userId);
}
