package com.skerp.skerp_backend.repo;

import com.skerp.skerp_backend.entity.Expense;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface ExpenseRepository extends JpaRepository<Expense, Long> {
    List<Expense> findByCategoryId(Long categoryId);
    List<Expense> findByExpenseDateBetween(LocalDate startDate, LocalDate endDate);
    List<Expense> findByCategoryIdAndExpenseDateBetween(Long categoryId, LocalDate startDate, LocalDate endDate);
}
