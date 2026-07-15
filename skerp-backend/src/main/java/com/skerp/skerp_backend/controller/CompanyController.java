package com.skerp.skerp_backend.controller;

import com.skerp.skerp_backend.entity.Company;
import com.skerp.skerp_backend.service.CompanyService;
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
    public ResponseEntity<List<Company>> getAllCompanies() {
        return ResponseEntity.ok(companyService.getAllCompanies());
    }

    @PostMapping
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
    public ResponseEntity<?> deleteCompany(@PathVariable Long id) {
        try {
            companyService.deleteCompany(id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PatchMapping("/{id}/toggle-status")
    public ResponseEntity<?> toggleCompanyStatus(@PathVariable Long id) {
        try {
            Company company = companyService.toggleCompanyStatus(id);
            return ResponseEntity.ok(company);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
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
