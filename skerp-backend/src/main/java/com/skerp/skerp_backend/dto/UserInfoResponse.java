package com.skerp.skerp_backend.dto;

import java.util.List;

public record UserInfoResponse(
    Long id,
    String username,
    String fullName,
    String email,
    Long companyId,
    List<String> roles,
    List<String> permissions,
    Long employeeId
) {}
