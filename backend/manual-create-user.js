require('dotenv').config();
const bcrypt = require('bcryptjs');
const { query } = require('./config/database');

async function createTestUser() {
    const email = 'testadmin@example.com';
    const password = 'password123';
    const name = 'Test Admin';
    const role = 'ADMIN';

    console.log(`Attempting to create user: ${email}`);

    try {
        // 1. Check if user exists
        const existing = await query('SELECT * FROM users WHERE email = $1', [email]);
        if (existing.rows.length > 0) {
            console.log('User already exists. Updating password...');
            const hashedPassword = await bcrypt.hash(password, 10);
            await query(
                'UPDATE users SET password_hash = $1, role = $2 WHERE email = $3',
                [hashedPassword, role, email]
            );
            console.log('✅ User updated successfully.');
        } else {
            console.log('User does not exist. Creating...');
            const hashedPassword = await bcrypt.hash(password, 10);

            // 2. Insert user
            // Note: We are using the exact columns from schema.sql
            // id, name, login, email, password_hash, role
            // We need to generate a UUID for 'login' if it's unique and required, or just use email

            const res = await query(
                `INSERT INTO users (name, login, email, password_hash, role) 
         VALUES ($1, $2, $3, $4, $5) 
         RETURNING id, email, role`,
                [name, email, email, hashedPassword, role]
            );
            console.log('✅ User created successfully:', res.rows[0]);
        }

        // 3. Verify Login Logic
        console.log('\n--- Verifying Login Logic ---');
        const userResult = await query('SELECT * FROM users WHERE email = $1', [email]);
        const user = userResult.rows[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);
        console.log(`Password match check: ${isMatch ? '✅ MATCH' : '❌ FAIL'}`);
        console.log('User Role:', user.role);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

createTestUser();
