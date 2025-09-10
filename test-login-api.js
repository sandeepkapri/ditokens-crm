require('dotenv').config();

async function testLoginAPI() {
  console.log('🧪 Testing login API email...');
  
  try {
    // Test the login API directly
    const response = await fetch('http://localhost:3000/api/auth/sign-in', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'sandeepkapri.sk@gmail.com',
        password: 'testpassword123'
      })
    });
    
    const result = await response.json();
    console.log('Login API response:', result);
    console.log('Status:', response.status);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testLoginAPI();
