package com.skerp.skerp_backend.dto;

import java.time.LocalDate;

public record ProfileEmployeeSummary(
        Long id,
        String role,
        String company,
        String department,
        LocalDate joined
) {}
