package com.skerp.skerp_backend.controller;

import com.skerp.skerp_backend.entity.Employee;
import com.skerp.skerp_backend.service.EmployeeService;
import com.skerp.skerp_backend.security.RequirePermission;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/employees")
public class EmployeeController {

    private final EmployeeService employeeService;

    @Autowired
    public EmployeeController(EmployeeService employeeService) {
        this.employeeService = employeeService;
    }

    @GetMapping
    @RequirePermission("VIEW_EMPLOYEES")
    public ResponseEntity<List<Employee>> getAllEmployees() {
        return ResponseEntity.ok(employeeService.getAllEmployees());
    }

    @PostMapping(consumes = "multipart/form-data")
    @RequirePermission("CREATE_EMPLOYEES")
    public ResponseEntity<?> createEmployee(
            @RequestParam Map<String, String> formFields,
            @RequestParam(value = "aadhaarProofFile", required = false) MultipartFile aadhaarProofFile,
            @RequestParam(value = "panProofFile", required = false) MultipartFile panProofFile,
            @RequestParam(value = "insuranceProofFile", required = false) MultipartFile insuranceProofFile) {
        try {
            Employee employee = employeeService.createEmployee(formFields, aadhaarProofFile, panProofFile, insuranceProofFile);
            return ResponseEntity.ok(employee);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    @RequirePermission("DELETE_EMPLOYEES")
    public ResponseEntity<?> deleteEmployee(@PathVariable Long id) {
        try {
            employeeService.deleteEmployee(id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping(value = "/{id}", consumes = "multipart/form-data")
    @RequirePermission("EDIT_EMPLOYEES")
    public ResponseEntity<?> updateEmployee(
            @PathVariable Long id,
            @RequestParam Map<String, String> formFields,
            @RequestParam(value = "aadhaarProofFile", required = false) MultipartFile aadhaarProofFile,
            @RequestParam(value = "panProofFile", required = false) MultipartFile panProofFile,
            @RequestParam(value = "insuranceProofFile", required = false) MultipartFile insuranceProofFile) {
        try {
            Employee employee = employeeService.updateEmployee(id, formFields, aadhaarProofFile, panProofFile, insuranceProofFile);
            return ResponseEntity.ok(employee);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/proofs/{filename}")
    @RequirePermission("VIEW_EMPLOYEES")
    public ResponseEntity<org.springframework.core.io.Resource> getProofFile(@PathVariable String filename) {
        try {
            org.springframework.core.io.Resource file = employeeService.loadProofFile(filename);
            String contentType = "application/octet-stream";
            if (filename.toLowerCase().endsWith(".pdf")) {
                contentType = "application/pdf";
            } else if (filename.toLowerCase().endsWith(".png")) {
                contentType = "image/png";
            } else if (filename.toLowerCase().endsWith(".jpg") || filename.toLowerCase().endsWith(".jpeg")) {
                contentType = "image/jpeg";
            }
            return ResponseEntity.ok()
                    .header(org.springframework.http.HttpHeaders.CONTENT_TYPE, contentType)
                    .body(file);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }
}
