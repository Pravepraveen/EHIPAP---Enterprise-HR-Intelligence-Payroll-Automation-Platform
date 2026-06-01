package com.ehipap.employee.repository;

import com.ehipap.employee.entity.Employee;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.*;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee, UUID> {
    Optional<Employee> findByEmployeeCode(String code);
    Optional<Employee> findByEmail(String email);
    Optional<Employee> findByUserId(UUID userId);
    List<Employee> findByDepartmentId(UUID departmentId);
    List<Employee> findByStatus(String status);
    long countByStatus(String status);

    @Query("SELECT e FROM Employee e WHERE " +
           "(COALESCE(:search, '') = '' OR " +
           "LOWER(e.firstName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(e.lastName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(e.email) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(e.employeeCode) LIKE LOWER(CONCAT('%', :search, '%'))) AND " +
           "(COALESCE(:status, '') = '' OR e.status = :status) AND " +
           "(:departmentId IS NULL OR e.departmentId = :departmentId)")
    Page<Employee> searchEmployees(@Param("search") String search,
                                   @Param("status") String status,
                                   @Param("departmentId") UUID departmentId,
                                   Pageable pageable);
}
