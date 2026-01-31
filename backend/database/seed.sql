-- Seed data for Budget Expense Tracker (Updated for UUID schema)

-- Insert default users (password is 'password' hashed with bcrypt)
INSERT INTO users (name, login, email, password_hash, role) VALUES
('Admin User', 'admin', 'admin@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'ADMIN'),
('Portal User', 'portal', 'portal@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'PORTAL')
ON CONFLICT (email) DO NOTHING;

-- Insert analytic accounts (cost centers)
INSERT INTO analytic_accounts (name, code) VALUES
('IT Department', 'IT001'),
('Marketing', 'MKT001'),
('Operations', 'OPS001'),
('Finance', 'FIN001'),
('HR', 'HR001')
ON CONFLICT (code) DO NOTHING;

-- Insert contacts
INSERT INTO contacts (name, email, contact_type) VALUES
('ABC Software Inc', 'contact@abcsoftware.com', 'VENDOR'),
('XYZ Corporation', 'info@xyzcorp.com', 'CUSTOMER'),
('Tech Solutions Ltd', 'sales@techsolutions.com', 'CUSTOMER'),
('Office Supplies Co', 'orders@officesupplies.com', 'VENDOR'),
('Global Enterprises', 'contact@globalent.com', 'CUSTOMER');

-- Insert product categories
INSERT INTO product_categories (name) VALUES
('Software'),
('Hardware'),
('Services'),
('Office Supplies'),
('Marketing');

-- Insert products
INSERT INTO products (name, category_id, price) VALUES
('Software License', (SELECT id FROM product_categories WHERE name = 'Software'), 1000.00),
('Laptop Computer', (SELECT id FROM product_categories WHERE name = 'Hardware'), 1200.00),
('Consulting Services', (SELECT id FROM product_categories WHERE name = 'Services'), 150.00),
('Office Chair', (SELECT id FROM product_categories WHERE name = 'Office Supplies'), 250.00),
('Marketing Campaign', (SELECT id FROM product_categories WHERE name = 'Marketing'), 5000.00);

-- Insert budgets with budget lines
DO $$
DECLARE
    budget_id_it UUID;
    budget_id_mkt UUID;
    budget_id_ops UUID;
BEGIN
    -- IT Budget
    INSERT INTO budgets (name, analytic_account_id, date_from, date_to, state)
    VALUES ('Annual IT Budget', 
            (SELECT id FROM analytic_accounts WHERE code = 'IT001'),
            '2024-01-01', '2024-12-31', 'ACTIVE')
    RETURNING id INTO budget_id_it;
    
    INSERT INTO budget_lines (budget_id, planned_amount) VALUES (budget_id_it, 50000.00);
    
    -- Marketing Budget
    INSERT INTO budgets (name, analytic_account_id, date_from, date_to, state)
    VALUES ('Marketing Budget', 
            (SELECT id FROM analytic_accounts WHERE code = 'MKT001'),
            '2024-01-01', '2024-12-31', 'ACTIVE')
    RETURNING id INTO budget_id_mkt;
    
    INSERT INTO budget_lines (budget_id, planned_amount) VALUES (budget_id_mkt, 30000.00);
    
    -- Operations Budget
    INSERT INTO budgets (name, analytic_account_id, date_from, date_to, state)
    VALUES ('Operations Budget', 
            (SELECT id FROM analytic_accounts WHERE code = 'OPS001'),
            '2024-01-01', '2024-12-31', 'ACTIVE')
    RETURNING id INTO budget_id_ops;
    
    INSERT INTO budget_lines (budget_id, planned_amount) VALUES (budget_id_ops, 40000.00);
END $$;

-- Insert sample customer invoices with invoice lines
DO $$
DECLARE
    invoice_id_1 UUID;
    invoice_id_2 UUID;
    invoice_id_3 UUID;
BEGIN
    -- Invoice 1
    INSERT INTO customer_invoices (customer_id, invoice_date, state)
    VALUES ((SELECT id FROM contacts WHERE name = 'XYZ Corporation'),
            '2024-01-15', 'POSTED')
    RETURNING id INTO invoice_id_1;
    
    INSERT INTO invoice_lines (invoice_id, product_id, quantity, price, analytic_account_id)
    VALUES (invoice_id_1, 
            (SELECT id FROM products WHERE name = 'Software License'),
            5, 1000.00,
            (SELECT id FROM analytic_accounts WHERE code = 'IT001'));
    
    -- Invoice 2
    INSERT INTO customer_invoices (customer_id, invoice_date, state)
    VALUES ((SELECT id FROM contacts WHERE name = 'Global Enterprises'),
            '2024-01-10', 'POSTED')
    RETURNING id INTO invoice_id_2;
    
    INSERT INTO invoice_lines (invoice_id, product_id, quantity, price, analytic_account_id)
    VALUES (invoice_id_2, 
            (SELECT id FROM products WHERE name = 'Marketing Campaign'),
            1, 3000.00,
            (SELECT id FROM analytic_accounts WHERE code = 'MKT001'));
    
    -- Invoice 3 (Draft)
    INSERT INTO customer_invoices (customer_id, invoice_date, state)
    VALUES ((SELECT id FROM contacts WHERE name = 'Tech Solutions Ltd'),
            '2024-01-20', 'DRAFT')
    RETURNING id INTO invoice_id_3;
    
    INSERT INTO invoice_lines (invoice_id, product_id, quantity, price, analytic_account_id)
    VALUES (invoice_id_3, 
            (SELECT id FROM products WHERE name = 'Consulting Services'),
            50, 150.00,
            (SELECT id FROM analytic_accounts WHERE code = 'IT001'));
END $$;

-- Insert sample payments
INSERT INTO payments (invoice_id, amount, payment_date)
VALUES 
((SELECT ci.id FROM customer_invoices ci 
  JOIN contacts c ON ci.customer_id = c.id 
  WHERE c.name = 'Global Enterprises' LIMIT 1), 
 3000.00, '2024-01-20');

-- Insert auto analytic rules
INSERT INTO auto_analytic_rules (name, sequence, product_id, analytic_account_id)
VALUES 
('Software License Rule', 10, 
 (SELECT id FROM products WHERE name = 'Software License'),
 (SELECT id FROM analytic_accounts WHERE code = 'IT001')),
('Marketing Campaign Rule', 20,
 (SELECT id FROM products WHERE name = 'Marketing Campaign'),
 (SELECT id FROM analytic_accounts WHERE code = 'MKT001'));