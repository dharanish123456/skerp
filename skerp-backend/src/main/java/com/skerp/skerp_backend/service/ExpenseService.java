package com.skerp.skerp_backend.service;

import com.skerp.skerp_backend.entity.Expense;
import com.skerp.skerp_backend.entity.ExpenseCategory;
import com.skerp.skerp_backend.repo.ExpenseCategoryRepository;
import com.skerp.skerp_backend.repo.ExpenseRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.TemporalAdjusters;
import java.util.*;

@Service
public class ExpenseService {

    private final ExpenseRepository expenseRepository;
    private final ExpenseCategoryRepository categoryRepository;

    @Autowired
    public ExpenseService(ExpenseRepository expenseRepository, ExpenseCategoryRepository categoryRepository) {
        this.expenseRepository = expenseRepository;
        this.categoryRepository = categoryRepository;
    }

    public List<Expense> getExpenses(LocalDate startDate, LocalDate endDate, Long categoryId) {
        if (categoryId != null && startDate != null && endDate != null) {
            return expenseRepository.findByCategoryIdAndExpenseDateBetween(categoryId, startDate, endDate);
        } else if (startDate != null && endDate != null) {
            return expenseRepository.findByExpenseDateBetween(startDate, endDate);
        } else if (categoryId != null) {
            return expenseRepository.findByCategoryId(categoryId);
        } else {
            return expenseRepository.findAll();
        }
    }

    public Expense createExpense(BigDecimal amount, Long categoryId, LocalDate expenseDate, String description) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Amount must be greater than zero");
        }
        if (expenseDate == null) {
            throw new IllegalArgumentException("Expense date is required");
        }
        ExpenseCategory category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new IllegalArgumentException("Category not found"));

        if (!category.isActive()) {
            throw new IllegalArgumentException("Cannot add expenses to an inactive category");
        }

        Expense expense = Expense.builder()
                .amount(amount)
                .category(category)
                .expenseDate(expenseDate)
                .description(description)
                .build();
        return expenseRepository.save(expense);
    }

    public Expense updateExpense(Long id, BigDecimal amount, Long categoryId, LocalDate expenseDate, String description) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Amount must be greater than zero");
        }
        if (expenseDate == null) {
            throw new IllegalArgumentException("Expense date is required");
        }
        Expense expense = expenseRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Expense not found"));

        ExpenseCategory category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new IllegalArgumentException("Category not found"));

        if (!category.isActive()) {
            throw new IllegalArgumentException("Cannot reassign expenses to an inactive category");
        }

        expense.setAmount(amount);
        expense.setCategory(category);
        expense.setExpenseDate(expenseDate);
        expense.setDescription(description);
        expense.setUpdatedAt(LocalDateTime.now());
        return expenseRepository.save(expense);
    }

    public void deleteExpense(Long id) {
        if (!expenseRepository.existsById(id)) {
            throw new IllegalArgumentException("Expense not found");
        }
        expenseRepository.deleteById(id);
    }

    public Map<String, Object> getExpenseSummary(LocalDate customStart, LocalDate customEnd) {
        LocalDate today = LocalDate.now();

        // 1. Spend today
        List<Expense> todayExpenses = expenseRepository.findByExpenseDateBetween(today, today);
        BigDecimal totalToday = todayExpenses.stream()
                .map(Expense::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // 2. Spend this week (Monday to Sunday)
        LocalDate startOfWeek = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        LocalDate endOfWeek = today.with(TemporalAdjusters.nextOrSame(DayOfWeek.SUNDAY));
        List<Expense> weekExpenses = expenseRepository.findByExpenseDateBetween(startOfWeek, endOfWeek);
        BigDecimal totalThisWeek = weekExpenses.stream()
                .map(Expense::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // 3. Spend this month
        LocalDate startOfMonth = today.with(TemporalAdjusters.firstDayOfMonth());
        LocalDate endOfMonth = today.with(TemporalAdjusters.lastDayOfMonth());
        List<Expense> monthExpenses = expenseRepository.findByExpenseDateBetween(startOfMonth, endOfMonth);
        BigDecimal totalThisMonth = monthExpenses.stream()
                .map(Expense::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // 4. Category breakdown (uses custom range or current month range)
        LocalDate breakdownStart = (customStart != null) ? customStart : startOfMonth;
        LocalDate breakdownEnd = (customEnd != null) ? customEnd : endOfMonth;

        List<Expense> breakdownExpenses = expenseRepository.findByExpenseDateBetween(breakdownStart, breakdownEnd);
        Map<Long, Map<String, Object>> categorySums = new HashMap<>();

        for (Expense exp : breakdownExpenses) {
            ExpenseCategory cat = exp.getCategory();
            Long catId = cat.getId();
            categorySums.computeIfAbsent(catId, k -> {
                Map<String, Object> map = new HashMap<>();
                map.put("categoryId", catId);
                map.put("categoryName", cat.getName());
                map.put("color", cat.getColor());
                map.put("icon", cat.getIcon());
                map.put("totalAmount", BigDecimal.ZERO);
                return map;
            });
            BigDecimal currentTotal = (BigDecimal) categorySums.get(catId).get("totalAmount");
            categorySums.get(catId).put("totalAmount", currentTotal.add(exp.getAmount()));
        }

        List<Map<String, Object>> categoryBreakdown = new ArrayList<>(categorySums.values());

        Map<String, Object> summary = new HashMap<>();
        summary.put("totalToday", totalToday);
        summary.put("totalThisWeek", totalThisWeek);
        summary.put("totalThisMonth", totalThisMonth);
        summary.put("categoryBreakdown", categoryBreakdown);

        return summary;
    }
}
