package com.skerp.skerp_backend.controller;

import com.skerp.skerp_backend.entity.Employee;
import com.skerp.skerp_backend.entity.EmployeeAdvance;
import com.skerp.skerp_backend.entity.User;
import com.skerp.skerp_backend.repo.EmployeeRepository;
import com.skerp.skerp_backend.security.RequirePermission;
import com.skerp.skerp_backend.service.EmployeeAdvanceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/employee-advances")
public class EmployeeSelfServiceController {

    private final EmployeeAdvanceService advanceService;
    private final EmployeeRepository employeeRepository;

    @Autowired
    public EmployeeSelfServiceController(EmployeeAdvanceService advanceService,
                                         EmployeeRepository employeeRepository) {
        this.advanceService = advanceService;
        this.employeeRepository = employeeRepository;
    }

    private Long resolveEmployeeId(User user) {
        Employee employee = employeeRepository.findByUserId(user.getId())
                .orElseThrow(() -> new IllegalStateException("No employee profile linked to this user account"));
        return employee.getId();
    }

    @GetMapping("/my-advances")
    @RequirePermission("VIEW_OWN_ADVANCES")
    public ResponseEntity<?> getMyAdvances(@AuthenticationPrincipal User user) {
        try {
            Long employeeId = resolveEmployeeId(user);
            List<Map<String, Object>> advances = advanceService.getAdvancesForEmployee(employeeId);
            return ResponseEntity.ok(advances);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/my-request")
    @RequirePermission("REQUEST_ADVANCE")
    public ResponseEntity<?> requestAdvance(@AuthenticationPrincipal User user,
                                            @RequestBody Map<String, Object> payload) {
        try {
            Long employeeId = resolveEmployeeId(user);
            EmployeeAdvance advance = advanceService.createAdvanceForEmployee(employeeId, payload);
            return ResponseEntity.ok(advance);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/my-advances/{id}/cancel")
    @RequirePermission("REQUEST_ADVANCE")
    public ResponseEntity<?> cancelMyAdvance(@AuthenticationPrincipal User user,
                                             @PathVariable Long id) {
        try {
            Long employeeId = resolveEmployeeId(user);
            advanceService.cancelAdvance(id, employeeId);
            return ResponseEntity.ok(Map.of("message", "Advance request cancelled successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
