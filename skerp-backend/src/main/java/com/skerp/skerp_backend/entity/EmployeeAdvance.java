package com.skerp.skerp_backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "employee_advances")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmployeeAdvance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @Column(name = "advance_date", nullable = false)
    private LocalDate advanceDate;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;

    private String reason;

    @Column(name = "payment_mode")
    private String paymentMode;

    @Column(name = "reference_no")
    private String referenceNo;


    @Column(columnDefinition = "TEXT")
    private String notes;

    @Builder.Default
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Builder.Default
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
