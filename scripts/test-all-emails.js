require('dotenv').config();
const { emailService } = require('../src/lib/email');
const { EmailEventManager } = require('../src/lib/email-events');
const { prisma } = require('../src/lib/prisma');

async function testAllEmails() {
  console.log('🚀 Testing All Email Functions\n');

  const testEmail = 'sandeepkapri.sk@gmail.com';
  const testName = 'Sandeep Kapri';

  try {
    // 1. Test email service connection
    console.log('1️⃣ Testing Email Service Connection...');
    const connectionTest = await emailService.testConnection();
    console.log(`   ${connectionTest ? '✅' : '❌'} Connection: ${connectionTest ? 'Success' : 'Failed'}\n`);

    // 2. Test signup email
    console.log('2️⃣ Testing Signup Email...');
    try {
      const signupResult = await emailService.sendWelcomeEmail(testEmail, testName);
      console.log(`   ${signupResult ? '✅' : '❌'} Signup Email: ${signupResult ? 'Sent' : 'Failed'}`);
    } catch (error) {
      console.log(`   ❌ Signup Email Error: ${error.message}`);
    }

    // 3. Test login notification
    console.log('\n3️⃣ Testing Login Notification...');
    try {
      const loginResult = await emailService.sendLoginNotification(
        testEmail,
        testName,
        new Date().toLocaleString(),
        '192.168.1.1'
      );
      console.log(`   ${loginResult ? '✅' : '❌'} Login Email: ${loginResult ? 'Sent' : 'Failed'}`);
    } catch (error) {
      console.log(`   ❌ Login Email Error: ${error.message}`);
    }

    // 4. Test purchase confirmation
    console.log('\n4️⃣ Testing Purchase Confirmation...');
    try {
      const purchaseResult = await emailService.sendPurchaseConfirmation(
        testEmail,
        testName,
        '1000',
        '100.00'
      );
      console.log(`   ${purchaseResult ? '✅' : '❌'} Purchase Email: ${purchaseResult ? 'Sent' : 'Failed'}`);
    } catch (error) {
      console.log(`   ❌ Purchase Email Error: ${error.message}`);
    }

    // 5. Test stake confirmation
    console.log('\n5️⃣ Testing Stake Confirmation...');
    try {
      const stakeResult = await emailService.sendStakeConfirmation(
        testEmail,
        testName,
        '500',
        '30 days'
      );
      console.log(`   ${stakeResult ? '✅' : '❌'} Stake Email: ${stakeResult ? 'Sent' : 'Failed'}`);
    } catch (error) {
      console.log(`   ❌ Stake Email Error: ${error.message}`);
    }

    // 6. Test payment confirmation
    console.log('\n6️⃣ Testing Payment Confirmation...');
    try {
      const paymentResult = await emailService.sendPaymentConfirmation(
        testEmail,
        testName,
        '100.00',
        'TXN123456789'
      );
      console.log(`   ${paymentResult ? '✅' : '❌'} Payment Email: ${paymentResult ? 'Sent' : 'Failed'}`);
    } catch (error) {
      console.log(`   ❌ Payment Email Error: ${error.message}`);
    }

    // 7. Test password reset
    console.log('\n7️⃣ Testing Password Reset...');
    try {
      const resetResult = await emailService.sendPasswordReset(
        testEmail,
        testName,
        'https://ditokens.com/reset?token=test123',
        '24 hours'
      );
      console.log(`   ${resetResult ? '✅' : '❌'} Password Reset Email: ${resetResult ? 'Sent' : 'Failed'}`);
    } catch (error) {
      console.log(`   ❌ Password Reset Email Error: ${error.message}`);
    }

    // 8. Test general notification
    console.log('\n8️⃣ Testing General Notification...');
    try {
      const notificationResult = await emailService.sendNotification(
        testEmail,
        testName,
        'Test Notification',
        'This is a test notification message.'
      );
      console.log(`   ${notificationResult ? '✅' : '❌'} Notification Email: ${notificationResult ? 'Sent' : 'Failed'}`);
    } catch (error) {
      console.log(`   ❌ Notification Email Error: ${error.message}`);
    }

    // 9. Test EmailEventManager functions
    console.log('\n9️⃣ Testing EmailEventManager...');
    try {
      const eventResult = await EmailEventManager.handleUserLogin(
        'test-user-id',
        { email: testEmail, name: testName },
        { ipAddress: '192.168.1.1', userAgent: 'Test Browser', timestamp: new Date() }
      );
      console.log(`   ${eventResult ? '✅' : '❌'} EventManager Login: ${eventResult ? 'Sent' : 'Failed'}`);
    } catch (error) {
      console.log(`   ❌ EventManager Error: ${error.message}`);
    }

    console.log('\n🎉 Email testing completed!');
    console.log('\n📧 Check your email inbox for the test emails.');
    console.log('   If you don\'t receive them, check:');
    console.log('   - Spam/Junk folder');
    console.log('   - Email service configuration');
    console.log('   - Zoho SMTP settings');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAllEmails();
