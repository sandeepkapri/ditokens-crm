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
    const { emailService } = require('./src/lib/email');
    
    console.log('1. Testing connection...');
    const connectionTest = await emailService.testConnection();
    console.log('Connection test:', connectionTest ? '✅ Success' : '❌ Failed');
    
    if (connectionTest) {
      console.log('2. Testing welcome email...');
      const result = await emailService.sendWelcomeEmail(
        'sandeepkapri.sk@gmail.com',
        'Sandeep Kapri'
      );
      console.log('Welcome email:', result ? '✅ Sent' : '❌ Failed');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testEmail();
