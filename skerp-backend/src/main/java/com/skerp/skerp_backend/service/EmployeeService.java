package com.skerp.skerp_backend.service;

import com.skerp.skerp_backend.entity.Company;
import com.skerp.skerp_backend.entity.Department;
import com.skerp.skerp_backend.entity.Employee;
import com.skerp.skerp_backend.repo.CompanyRepository;
import com.skerp.skerp_backend.repo.DepartmentRepository;
import com.skerp.skerp_backend.repo.EmployeeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class EmployeeService {

    private final EmployeeRepository employeeRepository;
    private final CompanyRepository companyRepository;
    private final DepartmentRepository departmentRepository;

    @Value("${app.upload.dir:uploads/employee-proofs}")
    private String uploadDir;

    @Autowired
    public EmployeeService(EmployeeRepository employeeRepository,
                           CompanyRepository companyRepository,
                           DepartmentRepository departmentRepository) {
        this.employeeRepository = employeeRepository;
        this.companyRepository = companyRepository;
        this.departmentRepository = departmentRepository;
    }

    public List<Employee> getAllEmployees() {
        return employeeRepository.findAll();
    }

    /**
     * Save an uploaded file to disk and return the stored filename.
     */
    private String saveFile(MultipartFile file, String prefix) throws IOException {
        if (file == null || file.isEmpty()) return null;

        Path dir = Paths.get(uploadDir);
        Files.createDirectories(dir);

        String originalName = file.getOriginalFilename();
        String extension = "";
        if (originalName != null && originalName.contains(".")) {
            extension = originalName.substring(originalName.lastIndexOf("."));
        }
        String storedName = prefix + "_" + UUID.randomUUID().toString().substring(0, 8) + extension;

        Path target = dir.resolve(storedName);
        Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);

        return storedName;
    }

    private void populateEmployee(Employee employee, Map<String, String> req) {
        Long companyId = Long.parseLong(req.get("companyId"));
        Long departmentId = Long.parseLong(req.get("departmentId"));

        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new IllegalArgumentException("Company not found"));
        Department department = departmentRepository.findById(departmentId)
                .orElseThrow(() -> new IllegalArgumentException("Department not found"));

        employee.setName(req.get("name"));
        employee.setEmail(req.getOrDefault("email", ""));
        employee.setCountryCode(req.getOrDefault("countryCode", "+91"));
        employee.setPhone(req.get("phone"));
        employee.setDob(LocalDate.parse(req.get("dob")));
        employee.setGender(req.get("gender"));
        employee.setState(req.get("state"));
        employee.setDistrict(req.get("district"));
        employee.setAddress(req.get("address"));
        employee.setCompany(company);
        employee.setDepartment(department);
        employee.setRole(req.get("role"));
        employee.setJoined(LocalDate.parse(req.get("joined")));
        employee.setEmploymentType(req.get("employmentType"));
        employee.setWages(new BigDecimal(req.get("wages")));
        employee.setStatus(req.getOrDefault("status", "Active"));
        employee.setAadhaar(req.get("aadhaar"));
        employee.setPan(req.get("pan"));
        employee.setEsic(req.getOrDefault("esic", ""));
        employee.setInsurance(req.getOrDefault("insurance", ""));
        employee.setAccountNumber(req.get("accountNumber"));
        employee.setIfsc(req.get("ifsc"));
        employee.setBankName(req.getOrDefault("bankName", ""));
    }

    public Employee createEmployee(Map<String, String> req,
                                   MultipartFile aadhaarProofFile,
                                   MultipartFile panProofFile,
                                   MultipartFile insuranceProofFile) throws IOException {
        Employee employee = new Employee();
        populateEmployee(employee, req);

        // Save uploaded files
        String aadhaarPath = saveFile(aadhaarProofFile, "aadhaar");
        String panPath = saveFile(panProofFile, "pan");
        String insurancePath = saveFile(insuranceProofFile, "insurance");

        if (aadhaarPath != null) employee.setAadhaarProof(aadhaarPath);
        if (panPath != null) employee.setPanProof(panPath);
        if (insurancePath != null) employee.setInsuranceProof(insurancePath);

        return employeeRepository.save(employee);
    }

    public void deleteEmployee(Long id) {
        employeeRepository.deleteById(id);
    }

    public Employee updateEmployee(Long id, Map<String, String> req,
                                   MultipartFile aadhaarProofFile,
                                   MultipartFile panProofFile,
                                   MultipartFile insuranceProofFile) throws IOException {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Employee not found"));

        populateEmployee(employee, req);

        // Only overwrite proof files if new ones are uploaded
        String aadhaarPath = saveFile(aadhaarProofFile, "aadhaar");
        String panPath = saveFile(panProofFile, "pan");
        String insurancePath = saveFile(insuranceProofFile, "insurance");

        if (aadhaarPath != null) employee.setAadhaarProof(aadhaarPath);
        if (panPath != null) employee.setPanProof(panPath);
        if (insurancePath != null) employee.setInsuranceProof(insurancePath);

        return employeeRepository.save(employee);
    }

    public org.springframework.core.io.Resource loadProofFile(String filename) {
        try {
            Path file = Paths.get(uploadDir).resolve(filename).normalize();
            org.springframework.core.io.Resource resource = new org.springframework.core.io.UrlResource(file.toUri());
            if (resource.exists() || resource.isReadable()) {
                return resource;
            } else {
                throw new RuntimeException("Could not read file: " + filename);
            }
        } catch (Exception e) {
            throw new RuntimeException("Could not read file: " + filename, e);
        }
    }
}
