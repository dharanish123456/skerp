package com.skerp.skerp_backend.entity;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "company")
public class Company {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String name;

    @Column(nullable = false)
    private LocalDate created;

    @Column(nullable = false)
    private String status = "Active";

    public Company() {
    }

    public Company(Long id, String name, LocalDate created, String status) {
        this.id = id;
        this.name = name;
        this.created = created;
        this.status = status;
    }

    public static Builder builder() {
        return new Builder();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public LocalDate getCreated() {
        return created;
    }

    public void setCreated(LocalDate created) {
        this.created = created;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public static final class Builder {
        private Long id;
        private String name;
        private LocalDate created;
        private String status = "Active";

        private Builder() {
        }

        public Builder id(Long id) {
            this.id = id;
            return this;
        }

        public Builder name(String name) {
            this.name = name;
            return this;
        }

        public Builder created(LocalDate created) {
            this.created = created;
            return this;
        }

        public Builder status(String status) {
            this.status = status;
            return this;
        }

        public Company build() {
            return new Company(id, name, created, status);
        }
    }
}
