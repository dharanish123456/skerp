package com.skerp.skerp_backend.controller;

import com.skerp.skerp_backend.entity.Expense;
import com.skerp.skerp_backend.service.ExpenseService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/expenses")
public class ExpenseController {

    private final ExpenseService expenseService;

    @Autowired
    public ExpenseController(ExpenseService expenseService) {
        this.expenseService = expenseService;
    }

    @GetMapping
    public ResponseEntity<List<Expense>> getExpenses(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) Long categoryId) {
        return ResponseEntity.ok(expenseService.getExpenses(startDate, endDate, categoryId));
    }

    @PostMapping
    public ResponseEntity<?> createExpense(@RequestBody Map<String, Object> request) {
        try {
            BigDecimal amount = new BigDecimal(request.get("amount").toString());
            Long categoryId = Long.valueOf(request.get("categoryId").toString());
            LocalDate expenseDate = LocalDate.parse(request.get("expenseDate").toString());
            String description = request.get("description") != null ? request.get("description").toString() : null;

            Expense expense = expenseService.createExpense(amount, categoryId, expenseDate, description);
            return ResponseEntity.ok(expense);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateExpense(@PathVariable Long id, @RequestBody Map<String, Object> request) {
        try {
            BigDecimal amount = new BigDecimal(request.get("amount").toString());
            Long categoryId = Long.valueOf(request.get("categoryId").toString());
            LocalDate expenseDate = LocalDate.parse(request.get("expenseDate").toString());
            String description = request.get("description") != null ? request.get("description").toString() : null;

            Expense expense = expenseService.updateExpense(id, amount, categoryId, expenseDate, description);
            return ResponseEntity.ok(expense);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteExpense(@PathVariable Long id) {
        try {
            expenseService.deleteExpense(id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/summary")
    public ResponseEntity<?> getExpenseSummary(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        try {
            return ResponseEntity.ok(expenseService.getExpenseSummary(startDate, endDate));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
