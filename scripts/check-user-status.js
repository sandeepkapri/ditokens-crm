#!/usr/bin/env node

/**
 * Check User Account Status
 * This script checks if a user exists and is active
 */

const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function checkUserStatus(email) {
  console.log(`🔍 Checking user status for: ${email}\n`);

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
        emailVerified: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      console.log('❌ User not found');
      console.log('   - This email is not registered in the system');
      return null;
    }

    console.log('✅ User found:');
    console.log(`   - ID: ${user.id}`);
    console.log(`   - Name: ${user.name}`);
    console.log(`   - Email: ${user.email}`);
    console.log(`   - Role: ${user.role}`);
    console.log(`   - Active: ${user.isActive ? '✅ Yes' : '❌ No'}`);
    console.log(`   - Email Verified: ${user.emailVerified ? '✅ Yes' : '❌ No'}`);
    console.log(`   - Created: ${user.createdAt.toLocaleString()}`);
    console.log(`   - Updated: ${user.updatedAt.toLocaleString()}`);

    if (!user.isActive) {
      console.log('\n⚠️  User account is deactivated!');
      console.log('   - This is why login is failing');
      console.log('   - You need to activate the account first');
    }

    return user;
  } catch (error) {
    console.error('❌ Error checking user status:', error.message);
    return null;
  } finally {
    await prisma.$disconnect();
  }
}

async function activateUser(email) {
  console.log(`\n🔧 Activating user account for: ${email}`);

  try {
    const user = await prisma.user.update({
      where: { email },
      data: { isActive: true },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true
      }
    });

    console.log('✅ User account activated successfully!');
    console.log(`   - ID: ${user.id}`);
    console.log(`   - Name: ${user.name}`);
    console.log(`   - Email: ${user.email}`);
    console.log(`   - Active: ${user.isActive ? '✅ Yes' : '❌ No'}`);

    return user;
  } catch (error) {
    console.error('❌ Error activating user:', error.message);
    return null;
  } finally {
    await prisma.$disconnect();
  }
}

async function runCheck() {
  const email = process.argv[2] || 'contact@ditokens.com';
  
  console.log('🚀 User Account Status Check\n');
  
  const user = await checkUserStatus(email);
  
  if (user && !user.isActive) {
    console.log('\n🔧 Would you like to activate this user account?');
    console.log('   Run: node scripts/check-user-status.js activate <email>');
  }
  
  if (process.argv[2] === 'activate') {
    const emailToActivate = process.argv[3] || email;
    await activateUser(emailToActivate);
  }
}

runCheck().catch(console.error);
