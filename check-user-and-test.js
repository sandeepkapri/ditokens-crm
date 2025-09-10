require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUserAndTest() {
  try {
    console.log('🔍 Checking user in database...');
    
    const user = await prisma.user.findUnique({
      where: { email: 'sandeepkapri.sk@gmail.com' }
    });
    
    if (user) {
      console.log('✅ User found:');
      console.log('  - ID:', user.id);
      console.log('  - Name:', user.name);
      console.log('  - Email:', user.email);
      console.log('  - Active:', user.isActive);
      console.log('  - Password set:', !!user.password);
      
      // Test password
      const bcrypt = require('bcryptjs');
      const testPassword = 'testpassword123';
      const isPasswordValid = await bcrypt.compare(testPassword, user.password);
      console.log('  - Password valid:', isPasswordValid);
      
    } else {
      console.log('❌ User not found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserAndTest();
