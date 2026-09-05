CREATE TABLE attendance (
    id BIGSERIAL PRIMARY KEY,
    employee_id BIGINT NOT NULL REFERENCES employee(id) ON DELETE CASCADE,
    attendance_date DATE NOT NULL,
    check_in TIME,
    check_out TIME,
    status VARCHAR(20) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_attendance_employee_date UNIQUE (employee_id, attendance_date),
    CONSTRAINT chk_attendance_status CHECK (status IN ('PRESENT', 'ABSENT', 'HALF_DAY')),
    CONSTRAINT chk_attendance_times CHECK (
        check_out IS NULL OR (check_in IS NOT NULL AND check_out > check_in)
    ),
    CONSTRAINT chk_non_present_has_no_times CHECK (
        status = 'PRESENT' OR (check_in IS NULL AND check_out IS NULL)
    )
);

CREATE INDEX idx_attendance_date_status ON attendance(attendance_date, status);

INSERT INTO permissions (name, description) VALUES
    ('VIEW_ATTENDANCE', 'View employee attendance'),
    ('CREATE_ATTENDANCE', 'Create employee attendance'),
    ('EDIT_ATTENDANCE', 'Edit employee attendance'),
    ('DELETE_ATTENDANCE', 'Delete employee attendance'),
    ('VIEW_OWN_ATTENDANCE', 'View own attendance'),
    ('MARK_OWN_ATTENDANCE', 'Check in and check out for own attendance')
ON CONFLICT (name) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT role.id, permission.id
FROM roles role
CROSS JOIN permissions permission
WHERE role.name = 'SUPER_ADMIN'
  AND permission.name IN (
      'VIEW_ATTENDANCE', 'CREATE_ATTENDANCE', 'EDIT_ATTENDANCE', 'DELETE_ATTENDANCE'
  )
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT role.id, permission.id
FROM roles role
CROSS JOIN permissions permission
WHERE role.name = 'EMPLOYEE'
  AND permission.name IN ('VIEW_OWN_ATTENDANCE', 'MARK_OWN_ATTENDANCE')
ON CONFLICT DO NOTHING;
