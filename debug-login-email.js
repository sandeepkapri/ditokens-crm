require('dotenv').config();

async function debugLoginEmail() {
  console.log('🔍 Debugging login email...');
  
  try {
    // Test 1: Direct email service
    console.log('1. Testing direct email service...');
    const { emailService } = require('./src/lib/email');
    
    const directResult = await emailService.sendLoginNotification(
      'sandeepkapri.sk@gmail.com',
      'Sandeep Kapri',
      new Date().toLocaleString(),
      '192.168.1.1'
    );
    
    console.log('Direct email result:', directResult ? '✅ Sent' : '❌ Failed');
    
    // Test 2: EmailEventManager
    console.log('\n2. Testing EmailEventManager...');
    const { EmailEventManager } = require('./src/lib/email-events');
    
    const eventResult = await EmailEventManager.handleUserLogin(
      'test-user-id',
      { email: 'sandeepkapri.sk@gmail.com', name: 'Sandeep Kapri' },
      { ipAddress: '192.168.1.1', userAgent: 'Test Browser', timestamp: new Date() }
    );
    
    console.log('EventManager result:', eventResult ? '✅ Sent' : '❌ Failed');
    
    // Test 3: Check user in database
    console.log('\n3. Checking user in database...');
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    const user = await prisma.user.findUnique({
      where: { email: 'sandeepkapri.sk@gmail.com' }
    });
    
    if (user) {
      console.log('User found:', {
        id: user.id,
        name: user.name,
        email: user.email,
        isActive: user.isActive,
        emailNotifications: user.emailNotifications
      });
    } else {
      console.log('❌ User not found in database');
    }
    
    await prisma.$disconnect();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

debugLoginEmail();
