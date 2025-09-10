require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    console.log('🔧 Creating/updating test user...');
    
    const hashedPassword = await bcrypt.hash('testpassword123', 12);
    
    const user = await prisma.user.upsert({
      where: { email: 'sandeepkapri.sk@gmail.com' },
      update: {
        password: hashedPassword,
        isActive: true,
        name: 'Sandeep Kapri'
      },
      create: {
        email: 'sandeepkapri.sk@gmail.com',
        password: hashedPassword,
        name: 'Sandeep Kapri',
        isActive: true,
        role: 'USER',
        contactNumber: '+1234567890',
        country: 'USA',
        state: 'CA'
      }
    });
    
    console.log('✅ User created/updated:');
    console.log('  - ID:', user.id);
    console.log('  - Name:', user.name);
    console.log('  - Email:', user.email);
    console.log('  - Active:', user.isActive);
    console.log('  - Password set:', !!user.password);
    
    // Test password
    const isPasswordValid = await bcrypt.compare('testpassword123', user.password);
    console.log('  - Password valid:', isPasswordValid);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();
