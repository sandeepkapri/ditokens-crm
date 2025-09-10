const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkSessionUser() {
  try {
    console.log('🔍 Checking all users and their status...\n');

    // Get all users with their details
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

    console.log('📊 All Users:\n');
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email})`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Active: ${user.isActive ? '✅ Yes' : '❌ No'}`);
      console.log(`   Tokens: ${user.availableTokens} available, ${user.totalTokens} total`);
      console.log(`   Created: ${user.createdAt.toLocaleString()}`);
      console.log('');
    });

    // Find inactive users
    const inactiveUsers = users.filter(user => !user.isActive);
    const activeUsers = users.filter(user => user.isActive);

    console.log(`📈 Summary:`);
    console.log(`   Total Users: ${users.length}`);
    console.log(`   Active Users: ${activeUsers.length}`);
    console.log(`   Inactive Users: ${inactiveUsers.length}`);

    if (inactiveUsers.length > 0) {
      console.log('\n⚠️  Inactive Users:');
      inactiveUsers.forEach(user => {
        console.log(`   - ${user.email} (${user.name})`);
      });
    }

    if (activeUsers.length > 0) {
      console.log('\n✅ Active Users:');
      activeUsers.forEach(user => {
        console.log(`   - ${user.email} (${user.name})`);
      });
    }

  } catch (error) {
    console.error('❌ Error checking users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSessionUser();
