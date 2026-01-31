require('dotenv').config();
const axios = require('axios');

const API_BASE = 'http://localhost:5001/api';

async function testFullAPI() {
  try {
    console.log('🔍 Testing Full API endpoints...');
    
    // Test login
    console.log('\n1. Testing authentication...');
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
    
    // Test products
    console.log('\n2. Testing products...');
    const productsResponse = await axios.get(`${API_BASE}/products`, authHeaders);
    console.log('✅ Products:', productsResponse.data.data.length, 'found');
    productsResponse.data.data.forEach(product => {
      console.log(`  - ${product.name} ($${product.price})`);
    });
    
    // Test invoices
    console.log('\n3. Testing invoices...');
    const invoicesResponse = await axios.get(`${API_BASE}/invoices`, authHeaders);
    console.log('✅ Invoices:', invoicesResponse.data.data.length, 'found');
    invoicesResponse.data.data.forEach(invoice => {
      console.log(`  - Invoice for ${invoice.customer_name} ($${invoice.total_amount})`);
    });
    
    // Test dashboard
    console.log('\n4. Testing dashboard...');
    const dashboardResponse = await axios.get(`${API_BASE}/admin/dashboard`, authHeaders);
    console.log('✅ Dashboard data:');
    console.log(`  - Total Budgets: ${dashboardResponse.data.kpis.totalBudgets}`);
    console.log(`  - Total Budget Amount: $${dashboardResponse.data.kpis.totalBudgetAmount}`);
    console.log(`  - Total Invoices: ${dashboardResponse.data.kpis.totalInvoices}`);
    console.log(`  - Total Invoice Amount: $${dashboardResponse.data.kpis.totalInvoiceAmount}`);
    
    // Test creating an invoice
    console.log('\n5. Testing invoice creation...');
    const costCentersResponse = await axios.get(`${API_BASE}/cost-centers`, authHeaders);
    const contactsResponse = await axios.get(`${API_BASE}/contacts`, authHeaders);
    const productsData = await axios.get(`${API_BASE}/products`, authHeaders);
    
    const customer = contactsResponse.data.data.find(c => c.contact_type === 'CUSTOMER');
    const product = productsData.data.data[0];
    const costCenter = costCentersResponse.data.data[0];
    
    if (customer && product && costCenter) {
      const newInvoice = {
        customer_id: customer.id,
        invoice_date: '2024-02-01',
        amount: 2500,
        product_id: product.id,
        analytic_account_id: costCenter.id
      };
      
      try {
        const createInvoiceResponse = await axios.post(`${API_BASE}/invoices`, newInvoice, authHeaders);
        console.log('✅ Invoice created successfully');
      } catch (error) {
        console.log('⚠️  Invoice creation failed:', error.response?.data?.error || error.message);
      }
    }
    
    console.log('\n🎉 Full API testing completed!');
    
  } catch (error) {
    console.error('❌ API test failed:', error.response?.data || error.message);
  } finally {
    process.exit(0);
  }
}

testFullAPI();