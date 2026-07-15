package com.skerp.skerp_backend.repo;

import com.skerp.skerp_backend.entity.ExpenseCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ExpenseCategoryRepository extends JpaRepository<ExpenseCategory, Long> {
    List<ExpenseCategory> findByActiveTrue();
    Optional<ExpenseCategory> findByNameIgnoreCase(String name);
    Optional<ExpenseCategory> findByName(String name);
    boolean existsByNameIgnoreCase(String name);
}
