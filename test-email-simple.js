require('dotenv').config();

console.log('🔧 Email Configuration Check');
console.log('============================');

console.log('ZOHO_EMAIL:', process.env.ZOHO_EMAIL);
console.log('ZOHO_PASSWORD:', process.env.ZOHO_PASSWORD ? '***SET***' : 'NOT SET');
console.log('ZOHO_SMTP_HOST:', process.env.ZOHO_SMTP_HOST);
console.log('ZOHO_SMTP_PORT:', process.env.ZOHO_SMTP_PORT);
console.log('EMAIL_FROM:', process.env.EMAIL_FROM);

console.log('\n🧪 Testing Email Service...');

async function testEmail() {
  try {
    // Test the email API endpoint
    const response = await fetch('http://localhost:3000/api/test/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'welcome',
        to: 'sandeepkapri.sk@gmail.com',
        name: 'Sandeep Kapri'
      })
    });
    
    const result = await response.json();
    console.log('Email API test result:', result);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testEmail();