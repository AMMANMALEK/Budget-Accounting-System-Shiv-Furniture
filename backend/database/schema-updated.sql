-- =====================================================
-- Budget Accounting System – Updated Database Schema
-- Tech: PostgreSQL
-- Updated to match existing backend logic
-- =====================================================

-- Enable UUID extension (for future use)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. USERS (System Logins)
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    login VARCHAR(50) UNIQUE,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL, -- Backend expects 'password', not 'password_hash'
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'portal')), -- Lowercase to match backend
    is_active BOOLEAN DEFAULT TRUE, -- Backend expects 'is_active', not 'active'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 2. CONTACTS (Customers / Vendors)
-- =====================================================
CREATE TABLE IF NOT EXISTS contacts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    type VARCHAR(20) NOT NULL CHECK (type IN ('customer', 'supplier', 'both')), -- Backend expects these values
    user_id INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_contact_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE SET NULL
);

-- =====================================================
-- 3. COST CENTERS (Analytic Accounts)
-- =====================================================
CREATE TABLE IF NOT EXISTS cost_centers ( -- Backend expects 'cost_centers'
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 4. BUDGETS (Simplified Structure)
-- =====================================================
CREATE TABLE IF NOT EXISTS budgets (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    cost_center_id INTEGER NOT NULL, -- Backend expects 'cost_center_id'
    planned_amount NUMERIC(16,2) NOT NULL CHECK (planned_amount > 0), -- Backend expects single amount
    start_date DATE NOT NULL, -- Backend expects 'start_date'
    end_date DATE NOT NULL, -- Backend expects 'end_date'
    description TEXT,
    state VARCHAR(20) DEFAULT 'draft' CHECK (state IN ('draft', 'active', 'closed')),
    revision_no INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_budget_cost_center
        FOREIGN KEY (cost_center_id) REFERENCES cost_centers(id),
    CONSTRAINT chk_budget_dates
        CHECK (start_date <= end_date)
);

-- =====================================================
-- 5. PRODUCT CATEGORIES
-- =====================================================
CREATE TABLE IF NOT EXISTS product_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 6. PRODUCTS
-- =====================================================
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category_id INTEGER,
    unit_price NUMERIC(16,2), -- Backend expects 'unit_price'
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_product_category
        FOREIGN KEY (category_id) REFERENCES product_categories(id)
);

-- =====================================================
-- 7. INVOICES (Customer Invoices)
-- =====================================================
CREATE TABLE IF NOT EXISTS invoices ( -- Backend expects 'invoices'
    id SERIAL PRIMARY KEY,
    invoice_number VARCHAR(100) UNIQUE,
    cost_center_id INTEGER NOT NULL,
    customer_id INTEGER,
    amount NUMERIC(16,2) NOT NULL CHECK (amount > 0), -- Backend expects single amount
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'posted', 'paid')),
    invoice_date DATE NOT NULL,
    due_date DATE,
    category VARCHAR(255),
    sub_category VARCHAR(255),
    tags TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_invoice_cost_center
        FOREIGN KEY (cost_center_id) REFERENCES cost_centers(id),
    CONSTRAINT fk_invoice_customer
        FOREIGN KEY (customer_id) REFERENCES contacts(id)
);

-- =====================================================
-- 8. PURCHASE BILLS (Missing from your schema)
-- =====================================================
CREATE TABLE IF NOT EXISTS purchase_bills (
    id SERIAL PRIMARY KEY,
    bill_number VARCHAR(100) UNIQUE,
    cost_center_id INTEGER NOT NULL,
    supplier_id INTEGER,
    amount NUMERIC(16,2) NOT NULL CHECK (amount > 0),
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'posted', 'paid')),
    bill_date DATE NOT NULL,
    due_date DATE,
    category VARCHAR(255),
    sub_category VARCHAR(255),
    tags TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_bill_cost_center
        FOREIGN KEY (cost_center_id) REFERENCES cost_centers(id),
    CONSTRAINT fk_bill_supplier
        FOREIGN KEY (supplier_id) REFERENCES contacts(id)
);

-- =====================================================
-- 9. PRODUCTION EXPENSES (Missing from your schema)
-- =====================================================
CREATE TABLE IF NOT EXISTS production_expenses (
    id SERIAL PRIMARY KEY,
    expense_number VARCHAR(100) UNIQUE,
    cost_center_id INTEGER NOT NULL,
    product_id INTEGER,
    amount NUMERIC(16,2) NOT NULL CHECK (amount > 0),
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'posted')),
    expense_date DATE NOT NULL,
    category VARCHAR(255),
    sub_category VARCHAR(255),
    tags TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_expense_cost_center
        FOREIGN KEY (cost_center_id) REFERENCES cost_centers(id),
    CONSTRAINT fk_expense_product
        FOREIGN KEY (product_id) REFERENCES products(id)
);

-- =====================================================
-- 10. PURCHASE ORDERS
-- =====================================================
CREATE TABLE IF NOT EXISTS purchase_orders (
    id SERIAL PRIMARY KEY,
    order_number VARCHAR(100) UNIQUE NOT NULL,
    supplier_id INTEGER NOT NULL,
    cost_center_id INTEGER NOT NULL,
    total_amount NUMERIC(16,2) NOT NULL CHECK (total_amount > 0),
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
    order_date DATE NOT NULL,
    expected_delivery_date DATE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_po_supplier
        FOREIGN KEY (supplier_id) REFERENCES contacts(id),
    CONSTRAINT fk_po_cost_center
        FOREIGN KEY (cost_center_id) REFERENCES cost_centers(id)
);

-- =====================================================
-- 11. PURCHASE ORDER ITEMS
-- =====================================================
CREATE TABLE IF NOT EXISTS purchase_order_items (
    id SERIAL PRIMARY KEY,
    purchase_order_id INTEGER NOT NULL,
    product_id INTEGER,
    quantity NUMERIC(10,2) NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(16,2) NOT NULL CHECK (unit_price > 0),
    total_price NUMERIC(16,2) NOT NULL CHECK (total_price > 0),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_poi_order
        FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id) ON DELETE CASCADE,
    CONSTRAINT fk_poi_product
        FOREIGN KEY (product_id) REFERENCES products(id)
);

-- =====================================================
-- 12. SALES ORDERS
-- =====================================================
CREATE TABLE IF NOT EXISTS sales_orders (
    id SERIAL PRIMARY KEY,
    order_number VARCHAR(100) UNIQUE NOT NULL,
    customer_id INTEGER NOT NULL,
    cost_center_id INTEGER NOT NULL,
    total_amount NUMERIC(16,2) NOT NULL CHECK (total_amount > 0),
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
    order_date DATE NOT NULL,
    expected_delivery_date DATE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_so_customer
        FOREIGN KEY (customer_id) REFERENCES contacts(id),
    CONSTRAINT fk_so_cost_center
        FOREIGN KEY (cost_center_id) REFERENCES cost_centers(id)
);

-- =====================================================
-- 13. SALES ORDER ITEMS
-- =====================================================
CREATE TABLE IF NOT EXISTS sales_order_items (
    id SERIAL PRIMARY KEY,
    sales_order_id INTEGER NOT NULL,
    product_id INTEGER,
    quantity NUMERIC(10,2) NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(16,2) NOT NULL CHECK (unit_price > 0),
    total_price NUMERIC(16,2) NOT NULL CHECK (total_price > 0),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_soi_order
        FOREIGN KEY (sales_order_id) REFERENCES sales_orders(id) ON DELETE CASCADE,
    CONSTRAINT fk_soi_product
        FOREIGN KEY (product_id) REFERENCES products(id)
);

-- =====================================================
-- 14. PAYMENTS
-- =====================================================
CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    type VARCHAR(50) NOT NULL CHECK (type IN ('invoice_payment', 'bill_payment')),
    reference_id INTEGER NOT NULL, -- invoiceId or purchaseBillId
    amount NUMERIC(16,2) NOT NULL CHECK (amount > 0),
    payment_date DATE NOT NULL,
    method VARCHAR(50) NOT NULL CHECK (method IN ('bank_transfer', 'credit_card', 'cash', 'check')),
    reference VARCHAR(255),
    description TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 15. AUTO ANALYTICS MODELS (Missing from your schema)
-- =====================================================
CREATE TABLE IF NOT EXISTS auto_analytics_models (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    conditions JSONB NOT NULL,
    actions JSONB NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    priority INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_budgets_cost_center_id ON budgets(cost_center_id);
CREATE INDEX IF NOT EXISTS idx_budgets_date_range ON budgets(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_invoices_cost_center_id ON invoices(cost_center_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_date ON invoices(invoice_date);
CREATE INDEX IF NOT EXISTS idx_purchase_bills_cost_center_id ON purchase_bills(cost_center_id);
CREATE INDEX IF NOT EXISTS idx_purchase_bills_status ON purchase_bills(status);
CREATE INDEX IF NOT EXISTS idx_production_expenses_cost_center_id ON production_expenses(cost_center_id);
CREATE INDEX IF NOT EXISTS idx_payments_type_reference ON payments(type, reference_id);

-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cost_centers_updated_at BEFORE UPDATE ON cost_centers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_budgets_updated_at BEFORE UPDATE ON budgets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_purchase_bills_updated_at BEFORE UPDATE ON purchase_bills FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_production_expenses_updated_at BEFORE UPDATE ON production_expenses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_purchase_orders_updated_at BEFORE UPDATE ON purchase_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sales_orders_updated_at BEFORE UPDATE ON sales_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_auto_analytics_models_updated_at BEFORE UPDATE ON auto_analytics_models FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();