require('dotenv').config();

console.log('🔧 Admin Email Test');
console.log('==================');

console.log('ADMIN_EMAILS:', process.env.ADMIN_EMAILS);
console.log('ZOHO_EMAIL:', process.env.ZOHO_EMAIL);
console.log('ZOHO_PASSWORD:', process.env.ZOHO_PASSWORD ? '***SET***' : 'NOT SET');

console.log('\n🧪 Testing Admin Email...');

async function testAdminEmail() {
  try {
    // Test the email API endpoint with admin email
    const response = await fetch('http://localhost:3000/api/test/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'purchase-pending-admin',
        to: 'admin@ditokens.com',
        userEmail: 'test@example.com',
        userName: 'Test User',
        amount: '100',
        tokenAmount: '35.71',
        walletAddress: '0x7E874A697007965c6A3DdB1702828A764E7a91c3',
        transactionId: 'test-123',
        paymentMethod: 'usdt'
      })
    });
    
    const result = await response.json();
    console.log('Admin email test result:', result);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testAdminEmail();
