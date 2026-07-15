-- Employee Advance: tracks advance money given to employees
CREATE TABLE IF NOT EXISTS employee_advances (
    id          BIGSERIAL PRIMARY KEY,
    employee_id BIGINT        NOT NULL,
    advance_date DATE         NOT NULL,
    amount      NUMERIC(15, 2) NOT NULL,
    reason      VARCHAR(255),
    payment_mode VARCHAR(50),
    reference_no VARCHAR(100),
    notes       TEXT,
    created_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_employee_advances_employee
        FOREIGN KEY (employee_id)
        REFERENCES employee(id)
        ON DELETE RESTRICT
);

-- Employee Advance Payments: tracks each recovery/deduction against an advance
CREATE TABLE IF NOT EXISTS employee_advance_payments (
    id           BIGSERIAL PRIMARY KEY,
    advance_id   BIGINT        NOT NULL,
    payment_date DATE          NOT NULL,
    amount       NUMERIC(15, 2) NOT NULL,
    type         VARCHAR(50)   NOT NULL,   -- SALARY_DEDUCTION | CASH_RETURN | ADJUSTMENT
    remarks      VARCHAR(500),
    created_at   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_advance_payments_advance
        FOREIGN KEY (advance_id)
        REFERENCES employee_advances(id)
        ON DELETE RESTRICT
);
