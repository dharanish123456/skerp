package com.skerp.skerp_backend.dto;

import java.util.List;

public record AuthResponse(
    String accessToken,
    String username,
    String fullName,
    List<String> roles,
    List<String> permissions,
    Long employeeId
) {}
