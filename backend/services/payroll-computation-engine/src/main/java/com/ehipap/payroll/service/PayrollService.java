package com.ehipap.payroll.service;

import com.ehipap.payroll.entity.*;
import com.ehipap.payroll.repository.*;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class PayrollService {
    private static final Logger log = LoggerFactory.getLogger(PayrollService.class);

    private final PayrollRunRepository payrollRunRepository;
    private final PayslipRepository payslipRepository;
    private final SalaryStructureRepository salaryStructureRepository;

    public List<PayrollRun> getAllRuns() {
        return payrollRunRepository.findAllByOrderByYearDescMonthDesc();
    }

    public List<Payslip> getPayslipsByEmployee(UUID employeeId) {
        return payslipRepository.findByEmployeeId(employeeId);
    }

    public List<Payslip> getPayslipsByRun(UUID runId) {
        return payslipRepository.findByPayrollRunId(runId);
    }

    public Optional<Payslip> getPayslip(UUID employeeId, int month, int year) {
        return payslipRepository.findByEmployeeIdAndMonthAndYear(employeeId, month, year);
    }

    public Optional<SalaryStructure> getSalaryStructure(UUID employeeId) {
        return salaryStructureRepository.findByEmployeeId(employeeId);
    }

    @Transactional
    public SalaryStructure saveSalaryStructure(SalaryStructure ss) {
        return salaryStructureRepository.save(ss);
    }

    @Transactional
    public PayrollRun processPayroll(int month, int year, UUID processedBy) {
        PayrollRun run = payrollRunRepository.findByMonthAndYear(month, year)
                .orElse(PayrollRun.builder().month(month).year(year).status("DRAFT").build());

        if ("PROCESSED".equals(run.getStatus())) {
            throw new RuntimeException("Payroll already processed for " + month + "/" + year);
        }

        List<SalaryStructure> structures = salaryStructureRepository.findAll();
        List<Payslip> payslips = new ArrayList<>();
        BigDecimal totalGross = BigDecimal.ZERO;
        BigDecimal totalDeductions = BigDecimal.ZERO;
        BigDecimal totalNet = BigDecimal.ZERO;

        for (SalaryStructure ss : structures) {
            Payslip payslip = computePayslip(ss, month, year, run.getId());
            payslips.add(payslip);
            totalGross = totalGross.add(payslip.getGrossSalary());
            totalDeductions = totalDeductions.add(payslip.getTotalDeductions());
            totalNet = totalNet.add(payslip.getNetSalary());
        }

        run.setStatus("PROCESSED");
        run.setTotalEmployees(payslips.size());
        run.setTotalGross(totalGross);
        run.setTotalDeductions(totalDeductions);
        run.setTotalNet(totalNet);
        run.setProcessedBy(processedBy);
        run.setProcessedAt(LocalDateTime.now());
        run = payrollRunRepository.save(run);

        final UUID runId = run.getId();
        payslips.forEach(p -> { p.setPayrollRunId(runId); payslipRepository.save(p); });

        log.info("Payroll processed for {}/{}: {} employees, net: {}", month, year, payslips.size(), totalNet);
        return run;
    }

    private Payslip computePayslip(SalaryStructure ss, int month, int year, UUID runId) {
        BigDecimal basic = ss.getBasicSalary();
        BigDecimal hra = basic.multiply(ss.getHraPercent()).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        BigDecimal da = basic.multiply(ss.getDaPercent()).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        BigDecimal ta = ss.getTaAmount();
        BigDecimal medical = ss.getMedicalAllowance();
        BigDecimal special = ss.getSpecialAllowance();
        BigDecimal gross = basic.add(hra).add(da).add(ta).add(medical).add(special);

        BigDecimal pfEmp = basic.multiply(ss.getPfEmployeePercent()).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        BigDecimal pfEmpr = basic.multiply(ss.getPfEmployerPercent()).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        BigDecimal esiBase = basic.add(hra).add(da);
        BigDecimal esiEmp = esiBase.multiply(ss.getEsiEmployeePercent()).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        BigDecimal esiEmpr = esiBase.multiply(ss.getEsiEmployerPercent()).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        BigDecimal pt = ss.getProfessionalTax();
        BigDecimal totalDed = pfEmp.add(esiEmp).add(pt);
        BigDecimal net = gross.subtract(totalDed);

        return Payslip.builder()
                .payrollRunId(runId).employeeId(ss.getEmployeeId())
                .month(month).year(year).workingDays(26)
                .presentDays(new BigDecimal("26")).basicSalary(basic)
                .hra(hra).da(da).ta(ta).medicalAllowance(medical).specialAllowance(special)
                .grossSalary(gross).pfEmployee(pfEmp).pfEmployer(pfEmpr)
                .esiEmployee(esiEmp).esiEmployer(esiEmpr).professionalTax(pt)
                .incomeTax(BigDecimal.ZERO).totalDeductions(totalDed).netSalary(net)
                .status("GENERATED").build();
    }

    public Map<String, Object> getPayrollStats() {
        List<PayrollRun> runs = payrollRunRepository.findAllByOrderByYearDescMonthDesc();
        BigDecimal totalPaid = runs.stream()
                .filter(r -> "PROCESSED".equals(r.getStatus()))
                .map(PayrollRun::getTotalNet)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        return Map.of(
                "totalRuns", runs.size(),
                "processedRuns", runs.stream().filter(r -> "PROCESSED".equals(r.getStatus())).count(),
                "totalPaid", totalPaid,
                "latestRun", runs.isEmpty() ? null : runs.get(0)
        );
    }
}
