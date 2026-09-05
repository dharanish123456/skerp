package com.skerp.skerp_backend.dto;

import java.time.LocalDateTime;
import java.util.List;

public record ProfileResponse(
        Long id,
        String username,
        String fullName,
        String email,
        boolean enabled,
        List<String> roles,
        List<String> permissions,
        LocalDateTime createdAt,
        ProfileEmployeeSummary employee
) {}
