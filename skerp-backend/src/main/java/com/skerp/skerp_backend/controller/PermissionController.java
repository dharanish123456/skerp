package com.skerp.skerp_backend.controller;

import com.skerp.skerp_backend.dto.PermissionResponse;
import com.skerp.skerp_backend.entity.Permission;
import com.skerp.skerp_backend.repo.PermissionRepository;
import com.skerp.skerp_backend.security.RequirePermission;
import com.skerp.skerp_backend.security.PermissionCatalog;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/permissions")
public class PermissionController {

    private final PermissionRepository permissionRepository;

    @Autowired
    public PermissionController(PermissionRepository permissionRepository) {
        this.permissionRepository = permissionRepository;
    }

    @GetMapping
    @RequirePermission("EDIT_ROLES")
    public List<PermissionResponse> getAllPermissions() {
        List<Permission> permissions = permissionRepository.findAll();
        return permissions.stream()
            .map(p -> new PermissionResponse(
                p.getId(),
                p.getName(),
                p.getDescription(),
                PermissionCatalog.moduleLabel(p.getName()),
                PermissionCatalog.action(p.getName())
            ))
            .toList();
    }
}
