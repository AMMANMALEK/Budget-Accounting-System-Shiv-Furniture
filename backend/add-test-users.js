require('dotenv').config();
const bcrypt = require('bcryptjs');
const { query } = require('./config/database');

async function addTestUsers() {
  try {
    console.log('🔍 Adding test users...');
    
    // Hash the password
    const hashedPassword = await bcrypt.hash('password', 10);
    
    // Add admin user
    try {
      await query(
        'INSERT INTO users (name, login, email, password_hash, role) VALUES ($1, $2, $3, $4, $5)',
        ['Admin User', 'admin', 'admin@example.com', hashedPassword, 'ADMIN']
      );
      console.log('✅ Added admin@example.com');
    } catch (error) {
      if (error.code === '23505') {
        console.log('ℹ️  admin@example.com already exists');
      } else {
        throw error;
      }
    }
    
    // Add portal user
    try {
      await query(
        'INSERT INTO users (name, login, email, password_hash, role) VALUES ($1, $2, $3, $4, $5)',
        ['Portal User', 'portal', 'portal@example.com', hashedPassword, 'PORTAL']
      );
      console.log('✅ Added portal@example.com');
    } catch (error) {
      if (error.code === '23505') {
        console.log('ℹ️  portal@example.com already exists');
      } else {
        throw error;
      }
    }
    
    // List all users
    const users = await query('SELECT id, name, email, role FROM users ORDER BY email');
    console.log('\n👥 All users:');
    users.rows.forEach(user => {
      console.log(`  - ${user.name} (${user.email}) - ${user.role}`);
    });
    
    console.log('\n🎉 Test users setup completed!');
    console.log('You can now login with:');
    console.log('  - admin@example.com / password (ADMIN)');
    console.log('  - portal@example.com / password (PORTAL)');
    
  } catch (error) {
    console.error('❌ Failed to add test users:', error.message);
    throw error;
  } finally {
    process.exit(0);
  }
}

addTestUsers();