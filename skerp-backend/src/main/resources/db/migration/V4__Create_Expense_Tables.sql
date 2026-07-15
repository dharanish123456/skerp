CREATE TABLE expense_categories (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    icon VARCHAR(255),
    color VARCHAR(255),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE expenses (
    id BIGSERIAL PRIMARY KEY,
    amount DECIMAL(15, 2) NOT NULL,
    category_id BIGINT NOT NULL,
    expense_date DATE NOT NULL,
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_expenses_category FOREIGN KEY(category_id) REFERENCES expense_categories(id) ON DELETE RESTRICT
);

INSERT INTO expense_categories (name, icon, color) VALUES
('Food', 'ri:restaurant-2-line', '#ff9f43'),
('Travel', 'ri:car-line', '#54a0ff'),
('Utilities', 'ri:lightbulb-line', '#1dd1a1'),
('Office Supplies', 'ri:pencil-ruler-line', '#5f27cd'),
('Software/Subscriptions', 'ri:macbook-line', '#00d2d3'),
('Miscellaneous', 'ri:price-tag-3-line', '#ff9ff3');
