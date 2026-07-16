package com.skerp.skerp_backend.controller;

import com.skerp.skerp_backend.dto.PermissionResponse;
import com.skerp.skerp_backend.dto.RoleRequest;
import com.skerp.skerp_backend.dto.RolePermissionsRequest;
import com.skerp.skerp_backend.dto.RoleResponse;
import com.skerp.skerp_backend.entity.Permission;
import com.skerp.skerp_backend.entity.Role;
import com.skerp.skerp_backend.repo.PermissionRepository;
import com.skerp.skerp_backend.repo.RoleRepository;
import com.skerp.skerp_backend.repo.UserRepository;
import com.skerp.skerp_backend.security.RequirePermission;
import com.skerp.skerp_backend.security.PermissionCatalog;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/admin/roles")
public class RoleController {

    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;
    private final UserRepository userRepository;

    @Autowired
    public RoleController(RoleRepository roleRepository,
                          PermissionRepository permissionRepository,
                          UserRepository userRepository) {
        this.roleRepository = roleRepository;
        this.permissionRepository = permissionRepository;
        this.userRepository = userRepository;
    }

    @GetMapping
    @RequirePermission("VIEW_ROLES")
    public ResponseEntity<List<RoleResponse>> getAllRoles() {
        List<Role> roles = roleRepository.findAll();
        List<RoleResponse> responses = roles.stream()
            .map(this::toRoleResponse)
            .toList();
        return ResponseEntity.ok(responses);
    }

    @GetMapping("/{id}")
    @RequirePermission("VIEW_ROLES")
    public ResponseEntity<?> getRoleById(@PathVariable Long id) {
        Optional<Role> roleOpt = roleRepository.findById(id);
        if (roleOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(toRoleResponse(roleOpt.get()));
    }

    @PostMapping
    @RequirePermission("CREATE_ROLES")
    public ResponseEntity<?> createRole(@RequestBody RoleRequest request) {
        if (request.name() == null || request.name().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Role name is required"));
        }
        
        String formattedName = request.name().trim().toUpperCase();
        if (roleRepository.existsByName(formattedName)) {
            return ResponseEntity.badRequest().body(Map.of("message", "Role name already exists"));
        }

        Role role = Role.builder()
            .name(formattedName)
            .description(request.description())
            .permissions(new HashSet<>())
            .build();

        Role savedRole = roleRepository.save(role);
        return ResponseEntity.ok(toRoleResponse(savedRole));
    }

    @PutMapping("/{id}")
    @RequirePermission("EDIT_ROLES")
    public ResponseEntity<?> updateRole(@PathVariable Long id, @RequestBody RoleRequest request) {
        Optional<Role> roleOpt = roleRepository.findById(id);
        if (roleOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Role role = roleOpt.get();
        
        // Safety check: SUPER_ADMIN is a system role and is fully read-only.
        if ("SUPER_ADMIN".equalsIgnoreCase(role.getName())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Cannot modify SUPER_ADMIN role"));
        }

        if (request.name() == null || request.name().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Role name is required"));
        }

        String formattedName = request.name().trim().toUpperCase();
        
        // If renaming, make sure new name is unique
        if (!formattedName.equalsIgnoreCase(role.getName()) && roleRepository.existsByName(formattedName)) {
            return ResponseEntity.badRequest().body(Map.of("message", "Role name already exists"));
        }

        role.setName(formattedName);
        role.setDescription(request.description());

        Role savedRole = roleRepository.save(role);
        return ResponseEntity.ok(toRoleResponse(savedRole));
    }

    @PutMapping("/{id}/permissions")
    @RequirePermission("EDIT_ROLES")
    public ResponseEntity<?> updateRolePermissions(
            @PathVariable Long id,
            @RequestBody RolePermissionsRequest request) {
        Optional<Role> roleOpt = roleRepository.findById(id);
        if (roleOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Role role = roleOpt.get();
        if ("SUPER_ADMIN".equalsIgnoreCase(role.getName())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Cannot modify SUPER_ADMIN permissions"));
        }

        List<Long> requestedIds = request.permissionIds() != null
            ? request.permissionIds()
            : Collections.emptyList();
        List<Permission> requestedPermissions = permissionRepository.findAllById(requestedIds);
        if (requestedPermissions.size() != new HashSet<>(requestedIds).size()) {
            return ResponseEntity.badRequest().body(Map.of("message", "One or more permissions are invalid"));
        }

        Set<String> selectedNames = requestedPermissions.stream()
            .filter(permission -> PermissionCatalog.isManaged(permission.getName()))
            .map(Permission::getName)
            .collect(java.util.stream.Collectors.toSet());

        Optional<String> actionWithoutView = selectedNames.stream()
            .filter(name -> !"VIEW".equals(PermissionCatalog.action(name)))
            .filter(name -> !selectedNames.contains(PermissionCatalog.requiredViewPermission(name)))
            .findFirst();
        if (actionWithoutView.isPresent()) {
            return ResponseEntity.badRequest().body(Map.of(
                "message",
                actionWithoutView.get() + " requires " + PermissionCatalog.requiredViewPermission(actionWithoutView.get())
            ));
        }

        Set<Permission> updatedPermissions = role.getPermissions().stream()
            .filter(permission -> !PermissionCatalog.isManaged(permission.getName()))
            .collect(java.util.stream.Collectors.toSet());
        requestedPermissions.stream()
            .filter(permission -> PermissionCatalog.isManaged(permission.getName()))
            .forEach(updatedPermissions::add);

        role.setPermissions(updatedPermissions);
        return ResponseEntity.ok(toRoleResponse(roleRepository.save(role)));
    }

    @DeleteMapping("/{id}")
    @RequirePermission("DELETE_ROLES")
    public ResponseEntity<?> deleteRole(@PathVariable Long id) {
        Optional<Role> roleOpt = roleRepository.findById(id);
        if (roleOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Role role = roleOpt.get();

        // Safety check: Block SUPER_ADMIN deletion
        if ("SUPER_ADMIN".equalsIgnoreCase(role.getName())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Cannot delete SUPER_ADMIN role"));
        }

        // Safety check: Block deletion of roles assigned to users
        if (userRepository.existsByRoleId(id)) {
            return ResponseEntity.badRequest().body(Map.of("message", "Cannot delete role currently assigned to users"));
        }

        roleRepository.delete(role);
        return ResponseEntity.ok().build();
    }

    private RoleResponse toRoleResponse(Role role) {
        List<PermissionResponse> permissions = role.getPermissions().stream()
            .map(p -> new PermissionResponse(
                p.getId(),
                p.getName(),
                p.getDescription(),
                PermissionCatalog.moduleLabel(p.getName()),
                PermissionCatalog.action(p.getName())
            ))
            .toList();
        return new RoleResponse(role.getId(), role.getName(), role.getDescription(), permissions);
    }

}
