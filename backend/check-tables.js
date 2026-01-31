const { query } = require('./config/database');

async function checkTables() {
  try {
    const result = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('📋 Database tables:');
    result.rows.forEach(row => console.log('  -', row.table_name));
    
    // Check for missing tables from schema
    const expectedTables = [
      'users', 'contacts', 'analytic_accounts', 'budgets', 'budget_lines',
      'product_categories', 'products', 'auto_analytic_rules', 'sales_orders',
      'sales_order_lines', 'customer_invoices', 'invoice_lines', 'payments'
    ];
    
    const existingTables = result.rows.map(row => row.table_name);
    const missingTables = expectedTables.filter(table => !existingTables.includes(table));
    
    if (missingTables.length > 0) {
      console.log('⚠️  Missing tables:', missingTables.join(', '));
    } else {
      console.log('✅ All expected tables are present');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkTables();