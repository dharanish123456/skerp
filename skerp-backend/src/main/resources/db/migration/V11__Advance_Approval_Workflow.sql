-- 1. Add status and admin_notes columns to employee_advances safely if they don't already exist
ALTER TABLE employee_advances ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'APPROVED';
ALTER TABLE employee_advances ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- 2. Migrate existing self-service requests from overloaded payment_mode
UPDATE employee_advances SET status = 'PENDING', payment_mode = NULL WHERE payment_mode = 'Pending Approval';

-- 3. Add APPROVE_ADVANCES permission
INSERT INTO permissions (name, description) VALUES
    ('APPROVE_ADVANCES', 'Approve or reject employee advance requests')
ON CONFLICT (name) DO NOTHING;

-- 4. Assign APPROVE_ADVANCES permission to SUPER_ADMIN, ADMIN, and HR roles
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name IN ('SUPER_ADMIN', 'ADMIN', 'HR') AND p.name = 'APPROVE_ADVANCES'
ON CONFLICT DO NOTHING;
