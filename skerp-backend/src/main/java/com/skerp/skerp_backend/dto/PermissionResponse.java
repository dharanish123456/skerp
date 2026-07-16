package com.skerp.skerp_backend.dto;

public record PermissionResponse(
    Long id,
    String name,
    String description,
    String module,
    String action
) {}
