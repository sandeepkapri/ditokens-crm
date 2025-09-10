const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkCurrentUser() {
  try {
    console.log('🔍 Checking current user status...\n');

    // Get all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
        role: true,
        availableTokens: true,
        totalTokens: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`📊 Found ${users.length} users:\n`);

    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email})`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Active: ${user.isActive ? '✅ Yes' : '❌ No'}`);
      console.log(`   Tokens: ${user.availableTokens} available, ${user.totalTokens} total`);
      console.log(`   Created: ${user.createdAt.toLocaleString()}`);
      console.log('');
    });

    // Check if any users are inactive
    const inactiveUsers = users.filter(user => !user.isActive);
    
    if (inactiveUsers.length > 0) {
      console.log('⚠️  Found inactive users:');
      inactiveUsers.forEach(user => {
        console.log(`   - ${user.email} (${user.name})`);
      });
      console.log('\n💡 To activate a user, run:');
      console.log(`   node scripts/check-user-status.js activate <email>`);
    } else {
      console.log('✅ All users are active!');
    }

  } catch (error) {
    console.error('❌ Error checking users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCurrentUser();
