require('dotenv').config();

async function testLoginFlow() {
  console.log('🧪 Testing complete login flow...');
  
  try {
    // Test login via NextAuth API
    const response = await fetch('http://localhost:3000/api/auth/signin/credentials', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        email: 'sandeepkapri.sk@gmail.com',
        password: 'testpassword123',
        redirect: 'false'
      })
    });
    
    const result = await response.text();
    console.log('Login response status:', response.status);
    console.log('Login response:', result);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testLoginFlow();
