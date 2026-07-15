package com.skerp.skerp_backend.repo;

import com.skerp.skerp_backend.entity.EmployeeAdvance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface EmployeeAdvanceRepository extends JpaRepository<EmployeeAdvance, Long> {
    List<EmployeeAdvance> findByEmployeeId(Long employeeId);
    List<EmployeeAdvance> findByAdvanceDateBetween(LocalDate startDate, LocalDate endDate);

    @Query("SELECT ea FROM EmployeeAdvance ea WHERE " +
           "(:employeeId IS NULL OR ea.employee.id = :employeeId) AND " +
           "(:startDate IS NULL OR ea.advanceDate >= :startDate) AND " +
           "(:endDate IS NULL OR ea.advanceDate <= :endDate)")
    List<EmployeeAdvance> findAdvancesWithFilters(
        @Param("employeeId") Long employeeId,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate
    );
}
