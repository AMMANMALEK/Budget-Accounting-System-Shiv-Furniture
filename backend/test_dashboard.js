const { dashboardDAL } = require('./database/dal');
require('dotenv').config();

async function test() {
  try {
    console.log('Testing Dashboard DAL...');
    const data = await dashboardDAL.getDashboardData();
    console.log('Dashboard Data:', JSON.stringify(data, null, 2));
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

test();
