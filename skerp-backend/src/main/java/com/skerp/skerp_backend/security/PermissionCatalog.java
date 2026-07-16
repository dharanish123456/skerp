package com.skerp.skerp_backend.security;

import java.util.Map;
import java.util.Set;

public final class PermissionCatalog {

    private static final Map<String, String> MODULE_LABELS = Map.of(
        "DASHBOARD", "Dashboard",
        "EMPLOYEES", "Employees",
        "COMPANIES", "Companies",
        "DEPARTMENTS", "Departments",
        "EXPENSES", "Expenses",
        "ADVANCES", "Employee Advances",
        "ROLES", "Roles & Permissions"
    );

    private static final Set<String> ACTIONS = Set.of("VIEW", "CREATE", "EDIT", "DELETE");

    private PermissionCatalog() {}

    public static String action(String permissionName) {
        if (permissionName == null) return "OTHER";
        int separator = permissionName.indexOf('_');
        String action = separator > 0 ? permissionName.substring(0, separator) : permissionName;
        return ACTIONS.contains(action) ? action : "OTHER";
    }

    public static String moduleKey(String permissionName) {
        if (permissionName == null) return "GENERAL";
        int separator = permissionName.indexOf('_');
        return separator > 0 ? permissionName.substring(separator + 1) : "GENERAL";
    }

    public static String moduleLabel(String permissionName) {
        return MODULE_LABELS.getOrDefault(moduleKey(permissionName), "General");
    }

    public static boolean isManaged(String permissionName) {
        String action = action(permissionName);
        String module = moduleKey(permissionName);
        if (!MODULE_LABELS.containsKey(module) || !ACTIONS.contains(action)) return false;
        return !"DASHBOARD".equals(module) || "VIEW".equals(action);
    }

    public static String requiredViewPermission(String permissionName) {
        return "VIEW_" + moduleKey(permissionName);
    }
}
