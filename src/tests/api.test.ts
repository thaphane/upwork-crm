import axios from 'axios';

const API_URL = 'http://localhost:5000/api';
let authToken: string;
let productId: string;

async function runTests() {
  try {
    // Test 1: Register
    console.log('\nTesting Registration...');
    const registerRes = await axios.post(`${API_URL}/auth/register`, {
      email: 'test@example.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'User'
    });
    console.log('Registration successful:', registerRes.data);

    // Test 2: Login
    console.log('\nTesting Login...');
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'test@example.com',
      password: 'password123'
    });
    authToken = loginRes.data.token;
    console.log('Login successful, token received');

    // Test 3: Create Lead
    console.log('\nTesting Lead Creation...');
    const leadRes = await axios.post(
      `${API_URL}/leads`,
      {
        name: 'John Smith',
        email: 'john@example.com',
        phone: '1234567890',
        source: 'Website'
      },
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    console.log('Lead created:', leadRes.data);

    // Test 4: Create Product
    console.log('\nTesting Product Creation...');
    const productRes = await axios.post(
      `${API_URL}/products`,
      {
        name: 'Test Product',
        description: 'A test product description',
        price: 99.99,
        category: 'Electronics',
        inventory: 100
      },
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    productId = productRes.data._id;
    console.log('Product created:', productRes.data);

    // Test 5: Generate QR Code
    console.log('\nTesting QR Code Generation...');
    const qrRes = await axios.get(
      `${API_URL}/products/${productId}/qr`,
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    console.log('QR Code generated:', qrRes.data);

    console.log('\nAll tests completed successfully!');
  } catch (error: any) {
    console.error('Test failed:', error.response?.data || error.message);
  }
}

runTests(); 