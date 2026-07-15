package com.skerp.skerp_backend.controller;

import com.skerp.skerp_backend.entity.EmployeeAdvance;
import com.skerp.skerp_backend.service.EmployeeAdvanceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/employee-advances")
@CrossOrigin(origins = "*")
public class EmployeeAdvanceController {

    private final EmployeeAdvanceService service;

    @Autowired
    public EmployeeAdvanceController(EmployeeAdvanceService service) {
        this.service = service;
    }

    @GetMapping
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
    public ResponseEntity<?> createAdvance(@RequestBody Map<String, Object> payload) {
        try {
            EmployeeAdvance advance = service.createAdvance(payload);
            return ResponseEntity.ok(advance);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateAdvance(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        try {
            EmployeeAdvance advance = service.updateAdvance(id, payload);
            return ResponseEntity.ok(advance);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteAdvance(@PathVariable Long id) {
        try {
            service.deleteAdvance(id);
            return ResponseEntity.ok(Map.of("message", "Employee advance deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/summary")
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
