package com.skerp.skerp_backend.controller;

import com.skerp.skerp_backend.entity.ExpenseCategory;
import com.skerp.skerp_backend.service.ExpenseCategoryService;
import com.skerp.skerp_backend.security.RequirePermission;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/expense-categories")
public class ExpenseCategoryController {

    private final ExpenseCategoryService categoryService;

    @Autowired
    public ExpenseCategoryController(ExpenseCategoryService categoryService) {
        this.categoryService = categoryService;
    }

    @GetMapping
    @RequirePermission("VIEW_EXPENSES")
    public ResponseEntity<List<ExpenseCategory>> getActiveCategories() {
        return ResponseEntity.ok(categoryService.getActiveCategories());
    }

    @PostMapping
    @RequirePermission("CREATE_EXPENSES")
    public ResponseEntity<?> createCategory(@RequestBody Map<String, String> request) {
        try {
            String name = request.get("name");
            String icon = request.get("icon");
            String color = request.get("color");
            ExpenseCategory category = categoryService.createCategory(name, icon, color);
            return ResponseEntity.ok(category);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    @RequirePermission("EDIT_EXPENSES")
    public ResponseEntity<?> updateCategory(@PathVariable Long id, @RequestBody Map<String, String> request) {
        try {
            String name = request.get("name");
            String icon = request.get("icon");
            String color = request.get("color");
            ExpenseCategory category = categoryService.updateCategory(id, name, icon, color);
            return ResponseEntity.ok(category);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    @RequirePermission("DELETE_EXPENSES")
    public ResponseEntity<?> deleteCategory(@PathVariable Long id) {
        try {
            categoryService.softDeleteCategory(id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
