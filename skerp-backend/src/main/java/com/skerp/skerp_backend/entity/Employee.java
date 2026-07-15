package com.skerp.skerp_backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "employee")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Employee {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    private String email;

    @Builder.Default
    @Column(name = "country_code", nullable = false)
    private String countryCode = "+91";

    @Column(nullable = false)
    private String phone;

    @Column(nullable = false)
    private LocalDate dob;

    @Column(nullable = false)
    private String gender;

    @Column(nullable = false)
    private String state;

    @Column(nullable = false)
    private String district;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String address;

    @ManyToOne(optional = false)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @ManyToOne(optional = false)
    @JoinColumn(name = "department_id", nullable = false)
    private Department department;

    @Column(nullable = false)
    private String role;

    @Column(nullable = false)
    private LocalDate joined;

    @Column(name = "employment_type", nullable = false)
    private String employmentType;

    @Column(nullable = false)
    private BigDecimal wages;

    @Builder.Default
    @Column(nullable = false)
    private String status = "Active";

    @Column(nullable = false)
    private String aadhaar;

    @Column(nullable = false)
    private String pan;

    private String esic;
    private String insurance;

    @Column(name = "account_number", nullable = false)
    private String accountNumber;

    @Column(nullable = false)
    private String ifsc;

    @Column(name = "bank_name")
    private String bankName;

    @Column(name = "aadhaar_proof")
    private String aadhaarProof;

    @Column(name = "pan_proof")
    private String panProof;

    @Column(name = "insurance_proof")
    private String insuranceProof;
}
