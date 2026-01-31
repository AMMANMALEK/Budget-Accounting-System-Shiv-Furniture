require('dotenv').config();
const { query } = require('./config/database');

async function addSampleData() {
  try {
    console.log('🔍 Adding sample data...');
    
    // Add analytic accounts
    const analyticAccounts = [
      { name: 'IT Department', code: 'IT001' },
      { name: 'Marketing', code: 'MKT001' },
      { name: 'Operations', code: 'OPS001' },
      { name: 'Finance', code: 'FIN001' },
      { name: 'HR', code: 'HR001' }
    ];
    
    for (const account of analyticAccounts) {
      try {
        await query(
          'INSERT INTO analytic_accounts (name, code) VALUES ($1, $2)',
          [account.name, account.code]
        );
        console.log(`✅ Added analytic account: ${account.name}`);
      } catch (error) {
        if (error.code === '23505') {
          console.log(`ℹ️  Analytic account ${account.name} already exists`);
        } else {
          throw error;
        }
      }
    }
    
    // Add product categories
    const categories = ['Software', 'Hardware', 'Services', 'Office Supplies', 'Marketing'];
    
    for (const category of categories) {
      try {
        await query(
          'INSERT INTO product_categories (name) VALUES ($1)',
          [category]
        );
        console.log(`✅ Added product category: ${category}`);
      } catch (error) {
        if (error.code === '23505') {
          console.log(`ℹ️  Product category ${category} already exists`);
        } else {
          console.log(`⚠️  Could not add category ${category}:`, error.message);
        }
      }
    }
    
    // Add contacts
    const contacts = [
      { name: 'ABC Software Inc', email: 'contact@abcsoftware.com', contact_type: 'VENDOR' },
      { name: 'XYZ Corporation', email: 'info@xyzcorp.com', contact_type: 'CUSTOMER' },
      { name: 'Tech Solutions Ltd', email: 'sales@techsolutions.com', contact_type: 'CUSTOMER' },
      { name: 'Office Supplies Co', email: 'orders@officesupplies.com', contact_type: 'VENDOR' },
      { name: 'Global Enterprises', email: 'contact@globalent.com', contact_type: 'CUSTOMER' }
    ];
    
    for (const contact of contacts) {
      try {
        await query(
          'INSERT INTO contacts (name, email, contact_type) VALUES ($1, $2, $3)',
          [contact.name, contact.email, contact.contact_type]
        );
        console.log(`✅ Added contact: ${contact.name}`);
      } catch (error) {
        if (error.code === '23505') {
          console.log(`ℹ️  Contact ${contact.name} already exists`);
        } else {
          console.log(`⚠️  Could not add contact ${contact.name}:`, error.message);
        }
      }
    }
    
    // List current data
    const accountsResult = await query('SELECT id, name, code FROM analytic_accounts ORDER BY name');
    console.log('\n🏢 Analytic Accounts:');
    accountsResult.rows.forEach(account => {
      console.log(`  - ${account.name} (${account.code})`);
    });
    
    const contactsResult = await query('SELECT id, name, contact_type FROM contacts ORDER BY name');
    console.log('\n👥 Contacts:');
    contactsResult.rows.forEach(contact => {
      console.log(`  - ${contact.name} (${contact.contact_type})`);
    });
    
    console.log('\n🎉 Sample data setup completed!');
    
  } catch (error) {
    console.error('❌ Failed to add sample data:', error.message);
    throw error;
  } finally {
    process.exit(0);
  }
}

addSampleData();