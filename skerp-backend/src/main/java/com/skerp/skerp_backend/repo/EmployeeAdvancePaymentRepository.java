package com.skerp.skerp_backend.repo;

import com.skerp.skerp_backend.entity.EmployeeAdvancePayment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EmployeeAdvancePaymentRepository extends JpaRepository<EmployeeAdvancePayment, Long> {
    List<EmployeeAdvancePayment> findByAdvanceId(Long advanceId);
    List<EmployeeAdvancePayment> findByAdvanceIdOrderByPaymentDateAscCreatedAtAsc(Long advanceId);
    boolean existsByAdvanceId(Long advanceId);
}
