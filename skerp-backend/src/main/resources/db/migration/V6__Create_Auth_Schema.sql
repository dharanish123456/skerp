-- Roles table
CREATE TABLE roles (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255)
);

-- Permissions table
CREATE TABLE permissions (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description VARCHAR(255)
);

-- Users table (company_id nullable — null for SUPER_ADMIN)
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100),
    full_name VARCHAR(100),
    enabled BOOLEAN DEFAULT TRUE,
    company_id BIGINT REFERENCES company(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Join tables
CREATE TABLE user_roles (
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    role_id BIGINT REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

CREATE TABLE role_permissions (
    role_id BIGINT REFERENCES roles(id) ON DELETE CASCADE,
    permission_id BIGINT REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- Seed roles
INSERT INTO roles (name, description) VALUES
    ('SUPER_ADMIN', 'Full system access, all companies'),
    ('COMPANY_ADMIN', 'Admin for a specific company'),
    ('MANAGER', 'Department manager'),
    ('EMPLOYEE', 'Regular employee');

-- Seed permissions
INSERT INTO permissions (name, description) VALUES
    ('MANAGE_USERS', 'Create, update, delete users'),
    ('MANAGE_ROLES', 'Create, update, delete roles'),
    ('VIEW_EMPLOYEES', 'View employee list'),
    ('MANAGE_EMPLOYEES', 'Create, update, delete employees'),
    ('VIEW_DEPARTMENTS', 'View departments'),
    ('MANAGE_DEPARTMENTS', 'Create, update, delete departments'),
    ('VIEW_EXPENSES', 'View expenses'),
    ('MANAGE_EXPENSES', 'Create, update, delete expenses'),
    ('VIEW_ADVANCES', 'View employee advances'),
    ('MANAGE_ADVANCES', 'Create, update, delete advances'),
    ('VIEW_COMPANIES', 'View companies'),
    ('MANAGE_COMPANIES', 'Create, update, delete companies'),
    ('VIEW_DASHBOARD', 'View dashboard');

-- SUPER_ADMIN gets ALL permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p WHERE r.name = 'SUPER_ADMIN';

-- Default admin user (password: 'admin' BCrypt-encoded)
INSERT INTO users (username, password, email, full_name, enabled)
VALUES ('admin', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
        'admin@skerp.com', 'Super Admin', true);

-- Assign SUPER_ADMIN role to admin user
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r
WHERE u.username = 'admin' AND r.name = 'SUPER_ADMIN';
