package com.ehipap.payroll.repository;

import com.ehipap.payroll.entity.SalaryStructure;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SalaryStructureRepository extends JpaRepository<SalaryStructure, UUID> {
    Optional<SalaryStructure> findByEmployeeId(UUID employeeId);
}
