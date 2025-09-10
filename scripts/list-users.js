#!/usr/bin/env node

/**
 * List All Users in Database
 * This script lists all users in the database
 */

const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function listUsers() {
  console.log('👥 Listing all users in the database\n');

  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
        emailVerified: true,
        role: true,
        createdAt: true,
        totalTokens: true,
        availableTokens: true,
        stakedTokens: true
      },
      orderBy: { createdAt: 'desc' }
    });

    if (users.length === 0) {
      console.log('❌ No users found in the database');
      return;
    }

    console.log(`✅ Found ${users.length} user(s):\n`);

    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email})`);
      console.log(`   - ID: ${user.id}`);
      console.log(`   - Role: ${user.role}`);
      console.log(`   - Active: ${user.isActive ? '✅ Yes' : '❌ No'}`);
      console.log(`   - Email Verified: ${user.emailVerified ? '✅ Yes' : '❌ No'}`);
      console.log(`   - Tokens: ${user.totalTokens} total, ${user.availableTokens} available, ${user.stakedTokens} staked`);
      console.log(`   - Created: ${user.createdAt.toLocaleString()}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error listing users:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

listUsers().catch(console.error);
