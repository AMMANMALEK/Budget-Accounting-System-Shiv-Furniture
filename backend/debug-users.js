require('dotenv').config();
const { query } = require('./config/database');

async function checkUsers() {
    try {
        console.log('Checking users in database...');
        const result = await query('SELECT id, email, role, active FROM users');
        console.log(JSON.stringify(result.rows, null, 2));
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkUsers();
