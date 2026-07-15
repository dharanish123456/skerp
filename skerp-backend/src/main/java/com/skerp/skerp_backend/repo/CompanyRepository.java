package com.skerp.skerp_backend.repo;

import com.skerp.skerp_backend.entity.Company;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CompanyRepository extends JpaRepository<Company, Long> {
    Optional<Company> findByNameIgnoreCase(String name);
    boolean existsByNameIgnoreCase(String name);
}
