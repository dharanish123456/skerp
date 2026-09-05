package com.skerp.skerp_backend.controller;

import com.skerp.skerp_backend.entity.EmployeeAdvance;
import com.skerp.skerp_backend.service.EmployeeAdvanceService;
import com.skerp.skerp_backend.security.RequirePermission;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/employee-advances")
public class EmployeeAdvanceController {

    private final EmployeeAdvanceService service;

    @Autowired
    public EmployeeAdvanceController(EmployeeAdvanceService service) {
        this.service = service;
    }

    @GetMapping
    @RequirePermission("VIEW_ADVANCES")
    public ResponseEntity<?> getAdvances(
            @RequestParam(required = false) Long employeeId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        try {
            List<Map<String, Object>> advances = service.getAdvances(employeeId, startDate, endDate);
            return ResponseEntity.ok(advances);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping
    @RequirePermission("CREATE_ADVANCES")
    public ResponseEntity<?> createAdvance(@RequestBody Map<String, Object> payload) {
        try {
            EmployeeAdvance advance = service.createAdvance(payload);
            return ResponseEntity.ok(advance);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    @RequirePermission("EDIT_ADVANCES")
    public ResponseEntity<?> updateAdvance(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        try {
            EmployeeAdvance advance = service.updateAdvance(id, payload);
            return ResponseEntity.ok(advance);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/{id}/approve")
    @RequirePermission("APPROVE_ADVANCES")
    public ResponseEntity<?> approveAdvance(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        try {
            EmployeeAdvance advance = service.approveAdvance(id, payload);
            return ResponseEntity.ok(advance);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/{id}/reject")
    @RequirePermission("APPROVE_ADVANCES")
    public ResponseEntity<?> rejectAdvance(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        try {
            EmployeeAdvance advance = service.rejectAdvance(id, payload);
            return ResponseEntity.ok(advance);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    @RequirePermission("DELETE_ADVANCES")
    public ResponseEntity<?> deleteAdvance(@PathVariable Long id) {
        try {
            service.deleteAdvance(id);
            return ResponseEntity.ok(Map.of("message", "Employee advance deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/summary")
    @RequirePermission("VIEW_ADVANCES")
    public ResponseEntity<?> getSummary(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        try {
            Map<String, Object> summary = service.getSummary(startDate, endDate);
            return ResponseEntity.ok(summary);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
