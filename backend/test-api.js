require('dotenv').config();
const axios = require('axios');

const API_BASE = 'http://localhost:5001/api';

async function testAPI() {
  try {
    console.log('🔍 Testing API endpoints...');
    
    // Test health endpoint
    console.log('\n1. Testing health endpoint...');
    const healthResponse = await axios.get(`${API_BASE}/health`);
    console.log('✅ Health check:', healthResponse.data);
    
    // Test login
    console.log('\n2. Testing authentication...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'admin@example.com',
      password: 'password'
    });
    console.log('✅ Login successful');
    const token = loginResponse.data.token;
    
    // Set up headers for authenticated requests
    const authHeaders = {
      headers: {
        Authorization: `Bearer ${token}`
      }
    };
    
    // Test cost centers (analytic accounts)
    console.log('\n3. Testing cost centers...');
    const costCentersResponse = await axios.get(`${API_BASE}/cost-centers`, authHeaders);
    console.log('✅ Cost centers:', costCentersResponse.data.data.length, 'found');
    costCentersResponse.data.data.forEach(cc => {
      console.log(`  - ${cc.name} (${cc.code})`);
    });
    
    // Test contacts
    console.log('\n4. Testing contacts...');
    const contactsResponse = await axios.get(`${API_BASE}/contacts`, authHeaders);
    console.log('✅ Contacts:', contactsResponse.data.data.length, 'found');
    contactsResponse.data.data.forEach(contact => {
      console.log(`  - ${contact.name} (${contact.contact_type})`);
    });
    
    // Test budgets
    console.log('\n5. Testing budgets...');
    const budgetsResponse = await axios.get(`${API_BASE}/budgets`, authHeaders);
    console.log('✅ Budgets:', budgetsResponse.data.data.length, 'found');
    budgetsResponse.data.data.forEach(budget => {
      console.log(`  - ${budget.name} (${budget.total_planned_amount || 0})`);
    });
    
    // Test creating a budget
    console.log('\n6. Testing budget creation...');
    const newBudget = {
      name: 'Test Budget',
      analytic_account_id: costCentersResponse.data.data[0].id,
      date_from: '2024-01-01',
      date_to: '2024-12-31',
      planned_amount: 10000
    };
    
    try {
      const createBudgetResponse = await axios.post(`${API_BASE}/budgets`, newBudget, authHeaders);
      console.log('✅ Budget created:', createBudgetResponse.data.name);
    } catch (error) {
      console.log('⚠️  Budget creation failed:', error.response?.data?.error || error.message);
    }
    
    console.log('\n🎉 API testing completed!');
    
  } catch (error) {
    console.error('❌ API test failed:', error.response?.data || error.message);
  } finally {
    process.exit(0);
  }
}

testAPI();