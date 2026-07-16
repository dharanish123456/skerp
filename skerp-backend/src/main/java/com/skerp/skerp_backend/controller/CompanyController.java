package com.skerp.skerp_backend.controller;

import com.skerp.skerp_backend.entity.Company;
import com.skerp.skerp_backend.service.CompanyService;
import com.skerp.skerp_backend.security.RequirePermission;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/companies")
public class CompanyController {

    private final CompanyService companyService;

    @Autowired
    public CompanyController(CompanyService companyService) {
        this.companyService = companyService;
    }

    @GetMapping
    @RequirePermission({"VIEW_COMPANIES", "VIEW_DEPARTMENTS", "VIEW_EMPLOYEES"})
    public ResponseEntity<List<Company>> getAllCompanies() {
        return ResponseEntity.ok(companyService.getAllCompanies());
    }

    @PostMapping
    @RequirePermission("CREATE_COMPANIES")
    public ResponseEntity<?> createCompany(@RequestBody Map<String, String> request) {
        try {
            String name = request.get("name");
            Company company = companyService.createCompany(name);
            return ResponseEntity.ok(company);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    @RequirePermission("DELETE_COMPANIES")
    public ResponseEntity<?> deleteCompany(@PathVariable Long id) {
        try {
            companyService.deleteCompany(id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PatchMapping("/{id}/toggle-status")
    @RequirePermission("EDIT_COMPANIES")
    public ResponseEntity<?> toggleCompanyStatus(@PathVariable Long id) {
        try {
            Company company = companyService.toggleCompanyStatus(id);
            return ResponseEntity.ok(company);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    @RequirePermission("EDIT_COMPANIES")
    public ResponseEntity<?> updateCompany(@PathVariable Long id, @RequestBody Map<String, String> request) {
        try {
            String name = request.get("name");
            Company company = companyService.updateCompany(id, name);
            return ResponseEntity.ok(company);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
