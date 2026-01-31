const { query } = require('./config/database');

async function addSampleProducts() {
  try {
    console.log('Adding sample product data...');
    
    // Insert product categories
    await query(`
      INSERT INTO product_categories (name) VALUES
      ('Software'),
      ('Hardware'),
      ('Services'),
      ('Office Supplies'),
      ('Marketing')
      ON CONFLICT DO NOTHING;
    `);
    console.log('✅ Product categories added');
    
    // Insert products
    await query(`
      INSERT INTO products (name, category_id, price) VALUES
      ('Software License', (SELECT id FROM product_categories WHERE name = 'Software'), 1000.00),
      ('Laptop Computer', (SELECT id FROM product_categories WHERE name = 'Hardware'), 1200.00),
      ('Consulting Services', (SELECT id FROM product_categories WHERE name = 'Services'), 150.00),
      ('Office Chair', (SELECT id FROM product_categories WHERE name = 'Office Supplies'), 250.00),
      ('Marketing Campaign', (SELECT id FROM product_categories WHERE name = 'Marketing'), 5000.00)
      ON CONFLICT DO NOTHING;
    `);
    console.log('✅ Products added');
    
    // Insert sample customer invoices with invoice lines
    const invoiceResult = await query(`
      INSERT INTO customer_invoices (customer_id, invoice_date, state)
      VALUES ((SELECT id FROM contacts WHERE name = 'XYZ Corporation' LIMIT 1),
              '2024-01-15', 'POSTED')
      RETURNING id;
    `);
    
    if (invoiceResult.rows.length > 0) {
      const invoiceId = invoiceResult.rows[0].id;
      
      await query(`
        INSERT INTO invoice_lines (invoice_id, product_id, quantity, price, analytic_account_id)
        VALUES ($1, 
                (SELECT id FROM products WHERE name = 'Software License' LIMIT 1),
                5, 1000.00,
                (SELECT id FROM analytic_accounts WHERE code = 'IT001' LIMIT 1));
      `, [invoiceId]);
      
      console.log('✅ Sample invoice created');
    }
    
    console.log('🎉 Sample product data added successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error adding sample data:', error.message);
    process.exit(1);
  }
}

addSampleProducts();