require('dotenv').config();
const { query } = require('./config/database');

async function testConnection() {
  try {
    console.log('🔍 Testing database connection...');
    
    // Test basic connection
    const result = await query('SELECT NOW() as current_time');
    console.log('✅ Database connected successfully');
    console.log('📅 Current time:', result.rows[0].current_time);
    
    // Test if tables exist
    const tables = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('\n📋 Available tables:');
    tables.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    
    // Test user data
    const users = await query('SELECT id, name, email, role FROM users LIMIT 5');
    console.log('\n👥 Sample users:');
    users.rows.forEach(user => {
      console.log(`  - ${user.name} (${user.email}) - ${user.role}`);
    });
    
    // Test analytic accounts
    const analyticAccounts = await query('SELECT id, name, code FROM analytic_accounts LIMIT 5');
    console.log('\n🏢 Sample analytic accounts:');
    analyticAccounts.rows.forEach(account => {
      console.log(`  - ${account.name} (${account.code})`);
    });
    
    console.log('\n🎉 Database test completed successfully!');
    
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    process.exit(0);
  }
}

testConnection();