package com.skerp.skerp_backend.repo;

import com.skerp.skerp_backend.entity.Department;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DepartmentRepository extends JpaRepository<Department, Long> {
    List<Department> findByCompanyId(Long companyId);
    boolean existsByNameIgnoreCaseAndCompanyId(String name, Long companyId);
}
