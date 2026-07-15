package com.skerp.skerp_backend.service;

import com.skerp.skerp_backend.entity.Company;
import com.skerp.skerp_backend.repo.CompanyRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
public class CompanyService {

    private final CompanyRepository companyRepository;

    @Autowired
    public CompanyService(CompanyRepository companyRepository) {
        this.companyRepository = companyRepository;
    }

    public List<Company> getAllCompanies() {
        return companyRepository.findAll();
    }

    public Company createCompany(String name) {
        String trimmedName = name.trim();
        if (trimmedName.isEmpty()) {
            throw new IllegalArgumentException("Company name cannot be empty");
        }
        if (companyRepository.existsByNameIgnoreCase(trimmedName)) {
            throw new IllegalArgumentException("A company with this name already exists");
        }
        Company company = Company.builder()
                .name(trimmedName)
                .created(LocalDate.now())
                .status("Active")
                .build();
        return companyRepository.save(company);
    }

    public void deleteCompany(Long id) {
        companyRepository.deleteById(id);
    }

    public Company toggleCompanyStatus(Long id) {
        Company company = companyRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Company not found with id: " + id));
        if ("Active".equalsIgnoreCase(company.getStatus())) {
            company.setStatus("Inactive");
        } else {
            company.setStatus("Active");
        }
        return companyRepository.save(company);
    }

    public Company updateCompany(Long id, String name) {
        String trimmedName = name.trim();
        if (trimmedName.isEmpty()) {
            throw new IllegalArgumentException("Company name cannot be empty");
        }
        Company company = companyRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Company not found with id: " + id));

        companyRepository.findByNameIgnoreCase(trimmedName).ifPresent(existing -> {
            if (!existing.getId().equals(id)) {
                throw new IllegalArgumentException("A company with this name already exists");
            }
        });

        company.setName(trimmedName);
        return companyRepository.save(company);
    }
}
