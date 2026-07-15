package com.skerp.skerp_backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

@Entity
@Table(name = "department", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"name", "company_id"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Department {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @ManyToOne(optional = false)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @Builder.Default
    @Column(nullable = false)
    private String status = "Active";

    @Column(nullable = false)
    private LocalDate created;
}
