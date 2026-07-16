INSERT INTO permissions (name, description) VALUES
    ('CREATE_EMPLOYEES', 'Create employees'),
    ('EDIT_EMPLOYEES', 'Edit employees'),
    ('DELETE_EMPLOYEES', 'Delete employees'),
    ('CREATE_COMPANIES', 'Create companies'),
    ('EDIT_COMPANIES', 'Edit companies'),
    ('DELETE_COMPANIES', 'Delete companies'),
    ('CREATE_DEPARTMENTS', 'Create departments'),
    ('EDIT_DEPARTMENTS', 'Edit departments'),
    ('DELETE_DEPARTMENTS', 'Delete departments'),
    ('CREATE_EXPENSES', 'Create expenses and expense categories'),
    ('EDIT_EXPENSES', 'Edit expenses and expense categories'),
    ('DELETE_EXPENSES', 'Delete expenses and expense categories'),
    ('CREATE_ADVANCES', 'Create employee advances'),
    ('EDIT_ADVANCES', 'Edit employee advances'),
    ('DELETE_ADVANCES', 'Delete employee advances'),
    ('VIEW_ROLES', 'View roles and permissions'),
    ('CREATE_ROLES', 'Create roles'),
    ('EDIT_ROLES', 'Edit roles and assign permissions'),
    ('DELETE_ROLES', 'Delete roles')
ON CONFLICT (name) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT rp.role_id, new_permission.id
FROM role_permissions rp
JOIN permissions old_permission ON old_permission.id = rp.permission_id
JOIN (VALUES
    ('MANAGE_EMPLOYEES', 'CREATE_EMPLOYEES'),
    ('MANAGE_EMPLOYEES', 'EDIT_EMPLOYEES'),
    ('MANAGE_EMPLOYEES', 'DELETE_EMPLOYEES'),
    ('MANAGE_COMPANIES', 'CREATE_COMPANIES'),
    ('MANAGE_COMPANIES', 'EDIT_COMPANIES'),
    ('MANAGE_COMPANIES', 'DELETE_COMPANIES'),
    ('MANAGE_DEPARTMENTS', 'CREATE_DEPARTMENTS'),
    ('MANAGE_DEPARTMENTS', 'EDIT_DEPARTMENTS'),
    ('MANAGE_DEPARTMENTS', 'DELETE_DEPARTMENTS'),
    ('MANAGE_EXPENSES', 'CREATE_EXPENSES'),
    ('MANAGE_EXPENSES', 'EDIT_EXPENSES'),
    ('MANAGE_EXPENSES', 'DELETE_EXPENSES'),
    ('MANAGE_ADVANCES', 'CREATE_ADVANCES'),
    ('MANAGE_ADVANCES', 'EDIT_ADVANCES'),
    ('MANAGE_ADVANCES', 'DELETE_ADVANCES'),
    ('MANAGE_ROLES', 'VIEW_ROLES'),
    ('MANAGE_ROLES', 'CREATE_ROLES'),
    ('MANAGE_ROLES', 'EDIT_ROLES'),
    ('MANAGE_ROLES', 'DELETE_ROLES')
) AS mapping(old_name, new_name) ON mapping.old_name = old_permission.name
JOIN permissions new_permission ON new_permission.name = mapping.new_name
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT role.id, permission.id
FROM roles role
CROSS JOIN permissions permission
WHERE role.name = 'SUPER_ADMIN'
  AND permission.name IN (
      'VIEW_DASHBOARD',
      'VIEW_EMPLOYEES', 'CREATE_EMPLOYEES', 'EDIT_EMPLOYEES', 'DELETE_EMPLOYEES',
      'VIEW_COMPANIES', 'CREATE_COMPANIES', 'EDIT_COMPANIES', 'DELETE_COMPANIES',
      'VIEW_DEPARTMENTS', 'CREATE_DEPARTMENTS', 'EDIT_DEPARTMENTS', 'DELETE_DEPARTMENTS',
      'VIEW_EXPENSES', 'CREATE_EXPENSES', 'EDIT_EXPENSES', 'DELETE_EXPENSES',
      'VIEW_ADVANCES', 'CREATE_ADVANCES', 'EDIT_ADVANCES', 'DELETE_ADVANCES',
      'VIEW_ROLES', 'CREATE_ROLES', 'EDIT_ROLES', 'DELETE_ROLES'
  )
ON CONFLICT DO NOTHING;
