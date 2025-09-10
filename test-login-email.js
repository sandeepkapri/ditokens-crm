require('dotenv').config();

async function testLoginEmail() {
  console.log('🧪 Testing login email function...');
  
  try {
    // Import the email service
    const { emailService } = require('./src/lib/email');
    
    console.log('1. Testing direct login email...');
    const result = await emailService.sendLoginNotification(
      'sandeepkapri.sk@gmail.com',
      'Sandeep Kapri',
      new Date().toLocaleString(),
      '192.168.1.1'
    );
    
    console.log('Login email result:', result ? '✅ Sent' : '❌ Failed');
    
    // Test the EmailEventManager
    console.log('\n2. Testing EmailEventManager...');
    const { EmailEventManager } = require('./src/lib/email-events');
    
    const eventResult = await EmailEventManager.handleUserLogin(
      'test-user-id',
      { email: 'sandeepkapri.sk@gmail.com', name: 'Sandeep Kapri' },
      { ipAddress: '192.168.1.1', userAgent: 'Test Browser', timestamp: new Date() }
    );
    
    console.log('EventManager result:', eventResult ? '✅ Sent' : '❌ Failed');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testLoginEmail();
