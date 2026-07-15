package com.skerp.skerp_backend.controller;

import com.skerp.skerp_backend.entity.Department;
import com.skerp.skerp_backend.service.DepartmentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/departments")
public class DepartmentController {

    private final DepartmentService departmentService;

    @Autowired
    public DepartmentController(DepartmentService departmentService) {
        this.departmentService = departmentService;
    }

    @GetMapping
    public ResponseEntity<List<Department>> getAllDepartments() {
        return ResponseEntity.ok(departmentService.getAllDepartments());
    }

    @PostMapping
    public ResponseEntity<?> createDepartment(@RequestBody Map<String, Object> request) {
        try {
            String name = (String) request.get("name");
            Number companyIdNum = (Number) request.get("companyId");
            if (companyIdNum == null) {
                return ResponseEntity.badRequest().body(Map.of("message", "companyId is required"));
            }
            Department department = departmentService.createDepartment(name, companyIdNum.longValue());
            return ResponseEntity.ok(department);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteDepartment(@PathVariable Long id) {
        try {
            departmentService.deleteDepartment(id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PatchMapping("/{id}/toggle-status")
    public ResponseEntity<?> toggleDepartmentStatus(@PathVariable Long id) {
        try {
            Department department = departmentService.toggleDepartmentStatus(id);
            return ResponseEntity.ok(department);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateDepartment(@PathVariable Long id, @RequestBody Map<String, Object> request) {
        try {
            String name = (String) request.get("name");
            Number companyIdNum = (Number) request.get("companyId");
            if (companyIdNum == null) {
                return ResponseEntity.badRequest().body(Map.of("message", "companyId is required"));
            }
            Department department = departmentService.updateDepartment(id, name, companyIdNum.longValue());
            return ResponseEntity.ok(department);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
