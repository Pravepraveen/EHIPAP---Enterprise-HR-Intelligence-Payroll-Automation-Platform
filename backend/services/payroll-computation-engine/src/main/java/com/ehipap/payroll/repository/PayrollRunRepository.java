package com.ehipap.payroll.repository;

import com.ehipap.payroll.entity.PayrollRun;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.*;

@Repository
public interface PayrollRunRepository extends JpaRepository<PayrollRun, UUID> {
    Optional<PayrollRun> findByMonthAndYear(Integer month, Integer year);
    List<PayrollRun> findAllByOrderByYearDescMonthDesc();
}
