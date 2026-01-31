-- =====================================================
-- Budget Accounting System – Final Database Schema
-- Tech: PostgreSQL
-- Style: Odoo-aligned ERP schema
-- Notes:
-- - UUID used for all primary keys
-- - Computed values are NOT stored
-- - Strong constraints enforced at DB level
-- =====================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. USERS (System Logins)
-- =====================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    login VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('ADMIN', 'PORTAL')),
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

-- =====================================================
-- 2. CONTACTS (Customers / Vendors)
-- =====================================================
CREATE TABLE contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    contact_type VARCHAR(20) NOT NULL CHECK (contact_type IN ('CUSTOMER', 'VENDOR')),
    user_id UUID UNIQUE,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_contact_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE SET NULL
);

-- =====================================================
-- 3. ANALYTIC ACCOUNTS (Cost Centers)
-- =====================================================
CREATE TABLE analytic_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 4. BUDGETS (Header)
-- =====================================================
CREATE TABLE budgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    analytic_account_id UUID NOT NULL,
    date_from DATE NOT NULL,
    date_to DATE NOT NULL,
    state VARCHAR(20) NOT NULL CHECK (state IN ('DRAFT', 'ACTIVE', 'CLOSED')),
    parent_budget_id UUID,
    revision_no INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_budget_analytic
        FOREIGN KEY (analytic_account_id) REFERENCES analytic_accounts(id),
    CONSTRAINT fk_budget_parent
        FOREIGN KEY (parent_budget_id) REFERENCES budgets(id),
    CONSTRAINT chk_budget_dates
        CHECK (date_from <= date_to)
);

-- =====================================================
-- 5. BUDGET LINES
-- =====================================================
CREATE TABLE budget_lines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    budget_id UUID NOT NULL,
    planned_amount NUMERIC(16,2) NOT NULL CHECK (planned_amount > 0),
    CONSTRAINT fk_budget_line_budget
        FOREIGN KEY (budget_id) REFERENCES budgets(id)
        ON DELETE CASCADE
);

-- =====================================================
-- 6. PRODUCT CATEGORIES
-- =====================================================
CREATE TABLE product_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL
);

-- =====================================================
-- 7. PRODUCTS
-- =====================================================
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    category_id UUID,
    price NUMERIC(16,2),
    active BOOLEAN DEFAULT TRUE,
    CONSTRAINT fk_product_category
        FOREIGN KEY (category_id) REFERENCES product_categories(id)
);

-- =====================================================
-- 8. AUTO ANALYTIC RULES
-- =====================================================
CREATE TABLE auto_analytic_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    sequence INTEGER DEFAULT 10,
    product_id UUID,
    product_category_id UUID,
    analytic_account_id UUID NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_rule_analytic
        FOREIGN KEY (analytic_account_id) REFERENCES analytic_accounts(id),
    CONSTRAINT chk_rule_condition
        CHECK (
            product_id IS NOT NULL
            OR product_category_id IS NOT NULL
        )
);

-- =====================================================
-- 9. SALES ORDERS (Header)
-- =====================================================
CREATE TABLE sales_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL,
    order_date DATE,
    state VARCHAR(20) CHECK (state IN ('DRAFT', 'CONFIRMED', 'CANCELLED')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_sales_customer
        FOREIGN KEY (customer_id) REFERENCES contacts(id)
);

-- =====================================================
-- 10. SALES ORDER LINES
-- =====================================================
CREATE TABLE sales_order_lines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL,
    product_id UUID NOT NULL,
    quantity NUMERIC(10,2),
    price NUMERIC(16,2),
    analytic_account_id UUID NOT NULL,
    CONSTRAINT fk_so_line_order
        FOREIGN KEY (order_id) REFERENCES sales_orders(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_so_line_product
        FOREIGN KEY (product_id) REFERENCES products(id),
    CONSTRAINT fk_so_line_analytic
        FOREIGN KEY (analytic_account_id) REFERENCES analytic_accounts(id)
);

-- =====================================================
-- 11. CUSTOMER INVOICES
-- =====================================================
CREATE TABLE customer_invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL,
    invoice_date DATE,
    state VARCHAR(20) CHECK (state IN ('DRAFT', 'POSTED', 'CANCELLED')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_invoice_customer
        FOREIGN KEY (customer_id) REFERENCES contacts(id)
);

-- =====================================================
-- 12. INVOICE LINES
-- =====================================================
CREATE TABLE invoice_lines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL,
    product_id UUID NOT NULL,
    quantity NUMERIC(10,2),
    price NUMERIC(16,2),
    analytic_account_id UUID NOT NULL,
    CONSTRAINT fk_invoice_line_invoice
        FOREIGN KEY (invoice_id) REFERENCES customer_invoices(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_invoice_line_product
        FOREIGN KEY (product_id) REFERENCES products(id),
    CONSTRAINT fk_invoice_line_analytic
        FOREIGN KEY (analytic_account_id) REFERENCES analytic_accounts(id)
);

-- =====================================================
-- 13. PAYMENTS
-- =====================================================
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL,
    amount NUMERIC(16,2),
    payment_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_payment_invoice
        FOREIGN KEY (invoice_id) REFERENCES customer_invoices(id)
);

-- =====================================================
-- END OF SCHEMA
-- =====================================================
