package com.ehipap.payroll.repository;

import com.ehipap.payroll.entity.Payslip;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.math.BigDecimal;
import java.util.*;

@Repository
public interface PayslipRepository extends JpaRepository<Payslip, UUID> {
    List<Payslip> findByEmployeeId(UUID employeeId);
    List<Payslip> findByPayrollRunId(UUID payrollRunId);
    Optional<Payslip> findByEmployeeIdAndMonthAndYear(UUID employeeId, Integer month, Integer year);
    List<Payslip> findByMonthAndYearOrderByCreatedAtDesc(Integer month, Integer year);

    @Query("SELECT SUM(p.netSalary) FROM Payslip p WHERE p.month = :month AND p.year = :year")
    BigDecimal sumNetSalaryByMonthAndYear(Integer month, Integer year);
}
