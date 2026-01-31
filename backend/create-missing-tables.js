const { query } = require('./config/database');

async function createMissingTables() {
  try {
    console.log('Creating missing tables...');
    
    // Create product_categories table
    await query(`
      CREATE TABLE IF NOT EXISTS product_categories (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          name VARCHAR(255) NOT NULL
      );
    `);
    console.log('✅ product_categories table created');
    
    // Create products table
    await query(`
      CREATE TABLE IF NOT EXISTS products (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          name VARCHAR(255) NOT NULL,
          category_id UUID,
          price NUMERIC(16,2),
          active BOOLEAN DEFAULT TRUE,
          CONSTRAINT fk_product_category
              FOREIGN KEY (category_id) REFERENCES product_categories(id)
      );
    `);
    console.log('✅ products table created');
    
    // Create sales_orders table
    await query(`
      CREATE TABLE IF NOT EXISTS sales_orders (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          customer_id UUID NOT NULL,
          order_date DATE,
          state VARCHAR(20) CHECK (state IN ('DRAFT', 'CONFIRMED', 'CANCELLED')),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT fk_sales_customer
              FOREIGN KEY (customer_id) REFERENCES contacts(id)
      );
    `);
    console.log('✅ sales_orders table created');
    
    // Create sales_order_lines table
    await query(`
      CREATE TABLE IF NOT EXISTS sales_order_lines (
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
    `);
    console.log('✅ sales_order_lines table created');
    
    // Create customer_invoices table
    await query(`
      CREATE TABLE IF NOT EXISTS customer_invoices (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          customer_id UUID NOT NULL,
          invoice_date DATE,
          state VARCHAR(20) CHECK (state IN ('DRAFT', 'POSTED', 'CANCELLED')),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT fk_invoice_customer
              FOREIGN KEY (customer_id) REFERENCES contacts(id)
      );
    `);
    console.log('✅ customer_invoices table created');
    
    // Create invoice_lines table
    await query(`
      CREATE TABLE IF NOT EXISTS invoice_lines (
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
    `);
    console.log('✅ invoice_lines table created');
    
    // Create payments table
    await query(`
      CREATE TABLE IF NOT EXISTS payments (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          invoice_id UUID NOT NULL,
          amount NUMERIC(16,2),
          payment_date DATE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT fk_payment_invoice
              FOREIGN KEY (invoice_id) REFERENCES customer_invoices(id)
      );
    `);
    console.log('✅ payments table created');
    
    console.log('🎉 All missing tables created successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error creating tables:', error.message);
    process.exit(1);
  }
}

createMissingTables();