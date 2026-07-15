package com.skerp.skerp_backend.service;

import com.skerp.skerp_backend.entity.Company;
import com.skerp.skerp_backend.entity.Department;
import com.skerp.skerp_backend.repo.CompanyRepository;
import com.skerp.skerp_backend.repo.DepartmentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
public class DepartmentService {

    private final DepartmentRepository departmentRepository;
    private final CompanyRepository companyRepository;

    @Autowired
    public DepartmentService(DepartmentRepository departmentRepository, CompanyRepository companyRepository) {
        this.departmentRepository = departmentRepository;
        this.companyRepository = companyRepository;
    }

    public List<Department> getAllDepartments() {
        return departmentRepository.findAll();
    }

    public Department createDepartment(String name, Long companyId) {
        String trimmedName = name.trim();
        if (trimmedName.isEmpty()) {
            throw new IllegalArgumentException("Department name cannot be empty");
        }
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new IllegalArgumentException("Company not found with id: " + companyId));

        if (departmentRepository.existsByNameIgnoreCaseAndCompanyId(trimmedName, companyId)) {
            throw new IllegalArgumentException("A department with this name already exists for this company");
        }

        Department department = Department.builder()
                .name(trimmedName)
                .company(company)
                .created(LocalDate.now())
                .status("Active")
                .build();

        return departmentRepository.save(department);
    }

    public void deleteDepartment(Long id) {
        departmentRepository.deleteById(id);
    }

    public Department toggleDepartmentStatus(Long id) {
        Department department = departmentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Department not found with id: " + id));
        if ("Active".equalsIgnoreCase(department.getStatus())) {
            department.setStatus("Inactive");
        } else {
            department.setStatus("Active");
        }
        return departmentRepository.save(department);
    }

    public Department updateDepartment(Long id, String name, Long companyId) {
        String trimmedName = name.trim();
        if (trimmedName.isEmpty()) {
            throw new IllegalArgumentException("Department name cannot be empty");
        }
        Department department = departmentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Department not found with id: " + id));

        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new IllegalArgumentException("Company not found with id: " + companyId));

        boolean exists = departmentRepository.findAll().stream()
                .anyMatch(d -> d.getName().equalsIgnoreCase(trimmedName) 
                        && d.getCompany().getId().equals(companyId) 
                        && !d.getId().equals(id));
        if (exists) {
            throw new IllegalArgumentException("A department with this name already exists for this company");
        }

        department.setName(trimmedName);
        department.setCompany(company);
        return departmentRepository.save(department);
    }
}
