package com.skerp.skerp_backend.service;

import com.skerp.skerp_backend.entity.Employee;
import com.skerp.skerp_backend.entity.EmployeeAdvance;
import com.skerp.skerp_backend.repo.EmployeeAdvanceRepository;
import com.skerp.skerp_backend.repo.EmployeeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class EmployeeAdvanceService {

    private final EmployeeAdvanceRepository advanceRepository;
    private final EmployeeRepository employeeRepository;

    @Autowired
    public EmployeeAdvanceService(
            EmployeeAdvanceRepository advanceRepository,
            EmployeeRepository employeeRepository) {
        this.advanceRepository = advanceRepository;
        this.employeeRepository = employeeRepository;
    }

    public List<Map<String, Object>> getAdvances(Long employeeId, LocalDate startDate, LocalDate endDate) {
        List<EmployeeAdvance> advances = advanceRepository.findAdvancesWithFilters(employeeId, startDate, endDate);
        return advances.stream()
                .map(this::mapToAdvanceResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public EmployeeAdvance createAdvance(Map<String, Object> payload) {
        if (payload.get("employeeId") == null) {
            throw new IllegalArgumentException("Employee ID is required");
        }
        Long employeeId = Long.valueOf(payload.get("employeeId").toString());
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new IllegalArgumentException("Employee not found with id: " + employeeId));

        if (payload.get("advanceDate") == null) {
            throw new IllegalArgumentException("Advance date is required");
        }
        LocalDate advanceDate = LocalDate.parse(payload.get("advanceDate").toString());

        if (payload.get("amount") == null) {
            throw new IllegalArgumentException("Amount is required");
        }
        BigDecimal amount = new BigDecimal(payload.get("amount").toString());
        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Amount must be greater than zero");
        }

        String reason = payload.get("reason") != null ? payload.get("reason").toString() : null;
        String paymentMode = payload.get("paymentMode") != null ? payload.get("paymentMode").toString() : null;
        String referenceNo = payload.get("referenceNo") != null ? payload.get("referenceNo").toString() : null;
        String notes = payload.get("notes") != null ? payload.get("notes").toString() : null;

        EmployeeAdvance advance = EmployeeAdvance.builder()
                .employee(employee)
                .advanceDate(advanceDate)
                .amount(amount)
                .reason(reason)
                .paymentMode(paymentMode)
                .referenceNo(referenceNo)
                .notes(notes)
                .build();

        return advanceRepository.save(advance);
    }

    @Transactional
    public EmployeeAdvance updateAdvance(Long id, Map<String, Object> payload) {
        EmployeeAdvance advance = advanceRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Employee advance not found with id: " + id));

        if (payload.get("employeeId") == null) {
            throw new IllegalArgumentException("Employee ID is required");
        }
        Long employeeId = Long.valueOf(payload.get("employeeId").toString());
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new IllegalArgumentException("Employee not found with id: " + employeeId));

        if (payload.get("advanceDate") == null) {
            throw new IllegalArgumentException("Advance date is required");
        }
        LocalDate advanceDate = LocalDate.parse(payload.get("advanceDate").toString());

        if (payload.get("amount") == null) {
            throw new IllegalArgumentException("Amount is required");
        }
        BigDecimal amount = new BigDecimal(payload.get("amount").toString());
        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Amount must be greater than zero");
        }

        advance.setEmployee(employee);
        advance.setAdvanceDate(advanceDate);
        advance.setAmount(amount);
        advance.setReason(payload.get("reason") != null ? payload.get("reason").toString() : null);
        advance.setPaymentMode(payload.get("paymentMode") != null ? payload.get("paymentMode").toString() : null);
        advance.setReferenceNo(payload.get("referenceNo") != null ? payload.get("referenceNo").toString() : null);
        advance.setNotes(payload.get("notes") != null ? payload.get("notes").toString() : null);
        advance.setUpdatedAt(LocalDateTime.now());

        return advanceRepository.save(advance);
    }

    @Transactional
    public void deleteAdvance(Long id) {
        if (!advanceRepository.existsById(id)) {
            throw new IllegalArgumentException("Employee advance not found with id: " + id);
        }
        advanceRepository.deleteById(id);
    }

    public Map<String, Object> getSummary(LocalDate startDate, LocalDate endDate) {
        List<EmployeeAdvance> advances = advanceRepository.findAdvancesWithFilters(null, startDate, endDate);

        BigDecimal totalAdvanceGiven = BigDecimal.ZERO;
        for (EmployeeAdvance adv : advances) {
            totalAdvanceGiven = totalAdvanceGiven.add(adv.getAmount());
        }

        // Count unique employees who have received advances
        long uniqueEmployeesCount = advances.stream()
                .map(adv -> adv.getEmployee().getId())
                .distinct()
                .count();

        Map<String, Object> summary = new HashMap<>();
        summary.put("totalAdvanceGiven", totalAdvanceGiven);
        summary.put("totalRecords", advances.size());
        summary.put("uniqueEmployeesCount", uniqueEmployeesCount);

        return summary;
    }

    public List<Map<String, Object>> getAdvancesForEmployee(Long employeeId) {
        List<EmployeeAdvance> advances = advanceRepository.findByEmployeeId(employeeId);
        return advances.stream()
                .map(this::mapToAdvanceResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public EmployeeAdvance createAdvanceForEmployee(Long employeeId, Map<String, Object> payload) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new IllegalArgumentException("Employee not found"));

        if (payload.get("amount") == null) {
            throw new IllegalArgumentException("Amount is required");
        }
        BigDecimal amount = new BigDecimal(payload.get("amount").toString());
        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Amount must be greater than zero");
        }

        String reason = payload.get("reason") != null ? payload.get("reason").toString() : null;
        String notes = payload.get("notes") != null ? payload.get("notes").toString() : null;

        EmployeeAdvance advance = EmployeeAdvance.builder()
                .employee(employee)
                .advanceDate(LocalDate.now())
                .amount(amount)
                .reason(reason)
                .status("PENDING")
                .paymentMode(null)
                .notes(notes)
                .build();

        return advanceRepository.save(advance);
    }

    @Transactional
    public void cancelAdvance(Long advanceId, Long employeeId) {
        EmployeeAdvance advance = advanceRepository.findById(advanceId)
                .orElseThrow(() -> new IllegalArgumentException("Advance not found"));
        if (!advance.getEmployee().getId().equals(employeeId)) {
            throw new IllegalArgumentException("You can only cancel your own advances");
        }
        if (!"PENDING".equals(advance.getStatus())) {
            throw new IllegalArgumentException("Only pending advance requests can be cancelled");
        }
        advanceRepository.deleteById(advanceId);
    }

    @Transactional
    public EmployeeAdvance approveAdvance(Long id, Map<String, Object> payload) {
        EmployeeAdvance advance = advanceRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Advance request not found with id: " + id));

        if (!"PENDING".equals(advance.getStatus())) {
            throw new IllegalArgumentException("Only pending advance requests can be approved");
        }

        String paymentMode = payload.get("paymentMode") != null ? payload.get("paymentMode").toString() : "Cash";
        String referenceNo = payload.get("referenceNo") != null ? payload.get("referenceNo").toString() : null;
        String adminNotes = payload.get("adminNotes") != null ? payload.get("adminNotes").toString() : null;

        advance.setStatus("APPROVED");
        advance.setPaymentMode(paymentMode);
        advance.setReferenceNo(referenceNo);
        if (adminNotes != null) {
            advance.setAdminNotes(adminNotes);
        }
        advance.setUpdatedAt(LocalDateTime.now());

        return advanceRepository.save(advance);
    }

    @Transactional
    public EmployeeAdvance rejectAdvance(Long id, Map<String, Object> payload) {
        EmployeeAdvance advance = advanceRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Advance request not found with id: " + id));

        if (!"PENDING".equals(advance.getStatus())) {
            throw new IllegalArgumentException("Only pending advance requests can be rejected");
        }

        String adminNotes = payload.get("adminNotes") != null ? payload.get("adminNotes").toString() : null;
        if (adminNotes == null || adminNotes.isBlank()) {
            throw new IllegalArgumentException("Reason / Admin notes are required when rejecting an advance");
        }

        advance.setStatus("REJECTED");
        advance.setAdminNotes(adminNotes);
        advance.setUpdatedAt(LocalDateTime.now());

        return advanceRepository.save(advance);
    }

    private Map<String, Object> mapToAdvanceResponse(EmployeeAdvance advance) {
        Map<String, Object> res = new LinkedHashMap<>();
        res.put("id", advance.getId());
        res.put("employeeId", advance.getEmployee().getId());
        res.put("employeeName", advance.getEmployee().getName());
        res.put("advanceDate", advance.getAdvanceDate());
        res.put("amount", advance.getAmount());
        res.put("status", advance.getStatus() != null ? advance.getStatus() : "APPROVED");
        res.put("paymentMode", advance.getPaymentMode());
        res.put("reason", advance.getReason());
        res.put("referenceNo", advance.getReferenceNo());
        res.put("notes", advance.getNotes());
        res.put("adminNotes", advance.getAdminNotes());
        return res;
    }
}
