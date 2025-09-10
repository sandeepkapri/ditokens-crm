require('dotenv').config();

async function testLoginDirect() {
  console.log('🧪 Testing login email directly...');
  
  try {
    const { sendLoginNotification } = require('./src/lib/email-events');
    
    const result = await sendLoginNotification(
      'test-user-id',
      { email: 'sandeepkapri.sk@gmail.com', name: 'Sandeep Kapri' },
      { ipAddress: '192.168.1.1', userAgent: 'Test Browser', timestamp: new Date() }
    );
    
    console.log('Login email result:', result ? '✅ Sent' : '❌ Failed');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testLoginDirect();
