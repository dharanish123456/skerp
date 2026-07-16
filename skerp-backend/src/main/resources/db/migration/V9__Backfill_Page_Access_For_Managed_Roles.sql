INSERT INTO role_permissions (role_id, permission_id)
SELECT rp.role_id, view_permission.id
FROM role_permissions rp
JOIN permissions manage_permission ON manage_permission.id = rp.permission_id
JOIN (VALUES
    ('MANAGE_EMPLOYEES', 'VIEW_EMPLOYEES'),
    ('MANAGE_COMPANIES', 'VIEW_COMPANIES'),
    ('MANAGE_DEPARTMENTS', 'VIEW_DEPARTMENTS'),
    ('MANAGE_EXPENSES', 'VIEW_EXPENSES'),
    ('MANAGE_ADVANCES', 'VIEW_ADVANCES'),
    ('MANAGE_ROLES', 'VIEW_ROLES')
) AS mapping(manage_name, view_name) ON mapping.manage_name = manage_permission.name
JOIN permissions view_permission ON view_permission.name = mapping.view_name
ON CONFLICT DO NOTHING;
