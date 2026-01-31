const fs = require('fs');
const path = require('path');
const { query } = require('../config/database');

async function initializeDatabase() {
  try {
    console.log('Initializing database...');
    
    // Check if all required tables exist
    const tablesResult = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'analytic_accounts', 'budgets', 'product_categories', 'products', 'customer_invoices', 'invoice_lines')
    `);
    
    const existingTables = tablesResult.rows.map(row => row.table_name);
    const requiredTables = ['users', 'analytic_accounts', 'budgets', 'product_categories', 'products', 'customer_invoices', 'invoice_lines'];
    const missingTables = requiredTables.filter(table => !existingTables.includes(table));
    
    if (missingTables.length === 0) {
      console.log('✅ All required database tables exist');
      console.log('Skipping schema creation...');
    } else {
      console.log('⚠️  Missing tables:', missingTables.join(', '));
      // Read and execute schema
      const schemaPath = path.join(__dirname, 'schema.sql');
      const schema = fs.readFileSync(schemaPath, 'utf8');
      
      console.log('Creating database schema...');
      await query(schema);
      console.log('✅ Database schema created successfully');
    }
    
    // Check if seed data exists
    const userCount = await query('SELECT COUNT(*) FROM users');
    const userCountValue = parseInt(userCount.rows[0].count);
    
    if (userCountValue > 0) {
      console.log(`✅ Database already has ${userCountValue} users. Skipping seed data...`);
    } else {
      // Read and execute seed data
      const seedPath = path.join(__dirname, 'seed.sql');
      const seedData = fs.readFileSync(seedPath, 'utf8');
      
      console.log('Seeding database with initial data...');
      await query(seedData);
      console.log('✅ Database seeded successfully');
    }
    
    console.log('🎉 Database initialization completed!');
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    throw error;
  }
}

// Run initialization if this file is executed directly
if (require.main === module) {
  initializeDatabase()
    .then(() => {
      console.log('Database initialization completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Database initialization failed:', error);
      process.exit(1);
    });
}

module.exports = { initializeDatabase };