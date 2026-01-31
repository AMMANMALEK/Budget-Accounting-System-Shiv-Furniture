const { query } = require('./config/database');

async function run() {
  try {
    console.log('Adding columns to contacts table...');
    await query(`ALTER TABLE contacts ADD COLUMN IF NOT EXISTS phone VARCHAR(50);`);
    await query(`ALTER TABLE contacts ADD COLUMN IF NOT EXISTS street VARCHAR(255);`);
    await query(`ALTER TABLE contacts ADD COLUMN IF NOT EXISTS city VARCHAR(100);`);
    await query(`ALTER TABLE contacts ADD COLUMN IF NOT EXISTS state VARCHAR(100);`);
    await query(`ALTER TABLE contacts ADD COLUMN IF NOT EXISTS country VARCHAR(100);`);
    await query(`ALTER TABLE contacts ADD COLUMN IF NOT EXISTS pincode VARCHAR(20);`);
    await query(`ALTER TABLE contacts ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'Active';`);
    console.log('Columns added successfully');
    process.exit(0);
  } catch (err) {
    console.error('Error adding columns:', err);
    process.exit(1);
  }
}

run();
