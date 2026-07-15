package com.skerp.skerp_backend.service;

import com.skerp.skerp_backend.entity.ExpenseCategory;
import com.skerp.skerp_backend.entity.Expense;
import com.skerp.skerp_backend.repo.ExpenseCategoryRepository;
import com.skerp.skerp_backend.repo.ExpenseRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ExpenseCategoryService {

    private final ExpenseCategoryRepository categoryRepository;
    private final ExpenseRepository expenseRepository;

    @Autowired
    public ExpenseCategoryService(ExpenseCategoryRepository categoryRepository, ExpenseRepository expenseRepository) {
        this.categoryRepository = categoryRepository;
        this.expenseRepository = expenseRepository;
    }

    public List<ExpenseCategory> getActiveCategories() {
        return categoryRepository.findByActiveTrue();
    }

    public ExpenseCategory createCategory(String name, String icon, String color) {
        String trimmedName = name.trim();
        if (trimmedName.isEmpty()) {
            throw new IllegalArgumentException("Category name cannot be empty");
        }
        if (categoryRepository.existsByNameIgnoreCase(trimmedName)) {
            throw new IllegalArgumentException("Category with this name already exists");
        }
        ExpenseCategory category = ExpenseCategory.builder()
                .name(trimmedName)
                .icon(icon)
                .color(color)
                .active(true)
                .build();
        return categoryRepository.save(category);
    }

    public ExpenseCategory updateCategory(Long id, String name, String icon, String color) {
        String trimmedName = name.trim();
        if (trimmedName.isEmpty()) {
            throw new IllegalArgumentException("Category name cannot be empty");
        }
        ExpenseCategory category = categoryRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Category not found with id: " + id));

        if ("Miscellaneous".equalsIgnoreCase(category.getName())) {
            throw new IllegalArgumentException("The 'Miscellaneous' category cannot be modified");
        }

        categoryRepository.findByNameIgnoreCase(trimmedName).ifPresent(existing -> {
            if (!existing.getId().equals(id)) {
                throw new IllegalArgumentException("Category with this name already exists");
            }
        });

        category.setName(trimmedName);
        category.setIcon(icon);
        category.setColor(color);
        return categoryRepository.save(category);
    }

    @Transactional
    public void softDeleteCategory(Long id) {
        ExpenseCategory category = categoryRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Category not found with id: " + id));

        if ("Miscellaneous".equalsIgnoreCase(category.getName())) {
            throw new IllegalArgumentException("The 'Miscellaneous' category cannot be deleted");
        }

        // Find or create Miscellaneous category for reassignment
        ExpenseCategory miscCategory = categoryRepository.findByNameIgnoreCase("Miscellaneous")
                .orElseGet(() -> {
                    ExpenseCategory newMisc = ExpenseCategory.builder()
                            .name("Miscellaneous")
                            .icon("ri:price-tag-3-line")
                            .color("#ff9ff3")
                            .active(true)
                            .build();
                    return categoryRepository.save(newMisc);
                });

        // Reassign expenses to Miscellaneous
        List<Expense> linkedExpenses = expenseRepository.findByCategoryId(id);
        if (!linkedExpenses.isEmpty()) {
            for (Expense expense : linkedExpenses) {
                expense.setCategory(miscCategory);
            }
            expenseRepository.saveAll(linkedExpenses);
        }

        category.setActive(false);
        categoryRepository.save(category);
    }
}
