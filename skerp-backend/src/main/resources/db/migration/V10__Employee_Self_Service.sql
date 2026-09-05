-- 1. Add user_id FK to employee table (nullable, for linking employee to user account)
ALTER TABLE employee ADD COLUMN user_id BIGINT REFERENCES users(id);
CREATE UNIQUE INDEX idx_employee_user_id ON employee(user_id) WHERE user_id IS NOT NULL;

-- 2. Add self-service permissions
INSERT INTO permissions (name, description) VALUES
    ('REQUEST_ADVANCE', 'Request a salary advance (self-service)'),
    ('VIEW_OWN_ADVANCES', 'View own advance requests (self-service)')
ON CONFLICT (name) DO NOTHING;

-- 3. Assign self-service permissions to EMPLOYEE role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'EMPLOYEE' AND p.name IN ('REQUEST_ADVANCE', 'VIEW_OWN_ADVANCES')
ON CONFLICT DO NOTHING;

-- 4. Ensure SUPER_ADMIN also gets these permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'SUPER_ADMIN' AND p.name IN ('REQUEST_ADVANCE', 'VIEW_OWN_ADVANCES')
ON CONFLICT DO NOTHING;
