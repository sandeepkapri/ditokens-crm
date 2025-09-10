require('dotenv').config();

console.log('🧪 Testing Email via API...');

async function testEmailAPI() {
  try {
    // Test signup email
    console.log('1. Testing signup email...');
    const signupResponse = await fetch('http://localhost:3000/api/test/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'signup',
        email: 'sandeepkapri.sk@gmail.com',
        name: 'Sandeep Kapri'
      })
    });
    
    const signupResult = await signupResponse.json();
    console.log('Signup email result:', signupResult);
    
    // Test login email
    console.log('\n2. Testing login email...');
    const loginResponse = await fetch('http://localhost:3000/api/test/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'login',
        email: 'sandeepkapri.sk@gmail.com',
        name: 'Sandeep Kapri'
      })
    });
    
    const loginResult = await loginResponse.json();
    console.log('Login email result:', loginResult);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testEmailAPI();
