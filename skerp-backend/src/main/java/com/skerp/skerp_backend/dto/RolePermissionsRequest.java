package com.skerp.skerp_backend.dto;

import java.util.List;

public record RolePermissionsRequest(List<Long> permissionIds) {}
