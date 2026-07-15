CREATE TABLE department (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    company_id BIGINT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Active',
    created DATE NOT NULL,
    CONSTRAINT fk_company FOREIGN KEY(company_id) REFERENCES company(id) ON DELETE CASCADE,
    CONSTRAINT unique_dept_per_company UNIQUE (name, company_id)
);
