package com.skerp.skerp_backend.dto;

import java.util.List;

public record RoleResponse(
    Long id,
    String name,
    String description,
    List<PermissionResponse> permissions
) {}
