require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function updateUserPassword() {
  try {
    console.log('🔧 Updating user password...');
    
    const hashedPassword = await bcrypt.hash('testpassword123', 12);
    
    const user = await prisma.user.update({
      where: { email: 'sandeepkapri.sk@gmail.com' },
      data: {
        password: hashedPassword,
        isActive: true
      }
    });
    
    console.log('✅ User password updated:');
    console.log('  - ID:', user.id);
    console.log('  - Name:', user.name);
    console.log('  - Email:', user.email);
    console.log('  - Active:', user.isActive);
    
    // Test password
    const isPasswordValid = await bcrypt.compare('testpassword123', user.password);
    console.log('  - Password valid:', isPasswordValid);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

updateUserPassword();
