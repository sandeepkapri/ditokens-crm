require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function activateUser() {
  try {
    console.log('🔧 Activating user: sandeepkapri.sk@gmail.com');
    
    const user = await prisma.user.update({
      where: { email: 'sandeepkapri.sk@gmail.com' },
      data: { isActive: true }
    });
    
    console.log('✅ User activated successfully!');
    console.log('User details:', {
      id: user.id,
      name: user.name,
      email: user.email,
      isActive: user.isActive
    });

    // Send activation email
    try {
      const { sendAccountActivated } = require('./src/lib/email-events');
      await sendAccountActivated(user.id, {
        email: user.email,
        name: user.name
      });
      console.log('📧 Account activation email sent successfully!');
    } catch (emailError) {
      console.error('❌ Failed to send activation email:', emailError.message);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

activateUser();
