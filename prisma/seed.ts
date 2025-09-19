import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clear existing data
  await prisma.notification.deleteMany();
  await prisma.referralCommission.deleteMany();
  await prisma.stakingRecord.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.profileUpdate.deleteMany();
  await prisma.userSettings.deleteMany();
  await prisma.passwordReset.deleteMany();
  await prisma.withdrawalRequest.deleteMany();
  await prisma.commissionSettings.deleteMany();
  await prisma.tokenSupply.deleteMany();
  await prisma.user.deleteMany();

  console.log('🗑️  Cleared existing data');

  // Create superadmin user
  const superadminPassword = await bcrypt.hash('superadmin123', 12);
  const superadmin = await prisma.user.create({
    data: {
      name: 'Ditokens Superadmin',
      email: 'superadmin@ditokens.com',
      password: superadminPassword,
      contactNumber: '+1 (555) 123-4567',
      country: 'United States',
      state: 'California',
      role: 'SUPERADMIN',
      isActive: true, // Superadmin is active by default
      emailVerified: true,
      referralCode: 'SUPER001',
      totalTokens: 1000000,
      stakedTokens: 500000,
      availableTokens: 500000,
      totalEarnings: 25000,
      referralEarnings: 5000,
      profilePicture: null,
    },
  });

  console.log('👑 Created superadmin user:', superadmin.email);

  // Create contact superadmin user
  const contactSuperadminPassword = await bcrypt.hash('contact123', 12);
  const contactSuperadmin = await prisma.user.create({
    data: {
      name: 'Ditokens Contact Superadmin',
      email: 'contact@ditokens.com',
      password: contactSuperadminPassword,
      contactNumber: '+1 (555) 987-6543',
      country: 'United States',
      state: 'New York',
      role: 'SUPERADMIN',
      isActive: true,
      emailVerified: true,
      referralCode: 'CONTACT001',
      totalTokens: 1000000,
      stakedTokens: 500000,
      availableTokens: 500000,
      totalEarnings: 25000,
      referralEarnings: 5000,
      profilePicture: null,
    },
  });

  console.log('👑 Created contact superadmin user:', contactSuperadmin.email);

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.create({
    data: {
      name: 'Ditokens Admin',
      email: 'admin@ditokens.com',
      password: adminPassword,
      contactNumber: '+1 (555) 123-4568',
      country: 'United States',
      state: 'California',
      role: 'ADMIN',
      isActive: true, // Admin is active by default
      emailVerified: true,
      referralCode: 'ADMIN001',
      totalTokens: 500000,
      stakedTokens: 200000,
      availableTokens: 300000,
      totalEarnings: 15000,
      referralEarnings: 3000,
      profilePicture: null,
    },
  });

  console.log('👨‍💼 Created admin user:', admin.email);

  // Create commission settings - only referral commission, no staking income
  await prisma.commissionSettings.create({
    data: {
      referralRate: 5.0, // 5% referral commission only
      updatedBy: superadmin.id,
    },
  });

  console.log('💰 Created commission settings');

  // Create token supply tracking (50M total supply limit)
  await prisma.tokenSupply.create({
    data: {
      totalSupply: 50000000, // 50M tokens
      tokensSold: 0, // Start with 0 sold
      tokensAvailable: 50000000, // All 50M available initially
      updatedBy: superadmin.id,
    },
  });

  console.log('🪙 Created token supply tracking (50M limit)');

  // Create regular users (inactive by default)
  const users = [];
  const userData = [
    {
      name: 'John Doe',
      email: 'john.doe@example.com',
      contactNumber: '+1 (555) 111-1111',
      country: 'United States',
      state: 'New York',
      totalTokens: 5000,
      stakedTokens: 2000,
      availableTokens: 3000,
      totalEarnings: 500,
      referralEarnings: 100,
    },
    {
      name: 'Jane Smith',
      email: 'jane.smith@example.com',
      contactNumber: '+1 (555) 222-2222',
      country: 'Canada',
      state: 'Ontario',
      totalTokens: 3000,
      stakedTokens: 1000,
      availableTokens: 2000,
      totalEarnings: 300,
      referralEarnings: 50,
    },
    {
      name: 'Mike Johnson',
      email: 'mike.johnson@example.com',
      contactNumber: '+1 (555) 333-3333',
      country: 'United Kingdom',
      state: 'London',
      totalTokens: 4000,
      stakedTokens: 1500,
      availableTokens: 2500,
      totalEarnings: 400,
      referralEarnings: 75,
    },
    {
      name: 'Sarah Wilson',
      email: 'sarah.wilson@example.com',
      contactNumber: '+1 (555) 444-4444',
      country: 'Australia',
      state: 'New South Wales',
      totalTokens: 6000,
      stakedTokens: 2500,
      availableTokens: 3500,
      totalEarnings: 600,
      referralEarnings: 120,
    },
    {
      name: 'David Brown',
      email: 'david.brown@example.com',
      contactNumber: '+1 (555) 555-5555',
      country: 'Germany',
      state: 'Bavaria',
      totalTokens: 3500,
      stakedTokens: 1200,
      availableTokens: 2300,
      totalEarnings: 350,
      referralEarnings: 60,
    },
  ];

  for (const userInfo of userData) {
    const userPassword = await bcrypt.hash('user123', 12);
    const user = await prisma.user.create({
      data: {
        ...userInfo,
        password: userPassword,
        role: 'USER',
        isActive: false, // Users are inactive by default
        emailVerified: false,
        referralCode: `USER${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        profilePicture: null,
      },
    });
    users.push(user);
  }

  console.log('👥 Created', users.length, 'regular users (inactive by default)');

  // Create referral relationships and commissions
  for (let i = 0; i < users.length; i++) {
    const referrer = users[i];
    const referredUser = users[(i + 1) % users.length];
    
    if (referrer.id !== referredUser.id) {
      // Create referral commission (5% of first deposit)
      const commissionAmount = (referredUser.totalTokens * 2.80 * 0.05) / 100;
      
      await prisma.referralCommission.create({
        data: {
          referrerId: referrer.id,
          referredUserId: referredUser.id,
          amount: commissionAmount,
          tokenAmount: referredUser.totalTokens * 0.05,
          pricePerToken: 2.80,
          commissionPercentage: 5.0,
          status: "APPROVED",
          month: new Date().getMonth() + 1,
          year: new Date().getFullYear(),
          isPaid: Math.random() > 0.3, // 70% paid
        },
      });

      // Update referrer's referral earnings
      await prisma.user.update({
        where: { id: referrer.id },
        data: {
          referralEarnings: {
            increment: commissionAmount,
          },
        },
      });
    }
  }

  console.log('💰 Created referral commissions');

  // Create staking records (no income)
  for (const user of users) {
    if (user.stakedTokens > 0) {
      await prisma.stakingRecord.create({
        data: {
          userId: user.id,
          amount: user.stakedTokens,
          apy: 0.0, // No staking income
          startDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
          endDate: new Date(Date.now() + (3 * 365 * 24 * 60 * 60 * 1000)), // 3 years from now
          status: 'ACTIVE',
          rewards: 0, // No rewards
        },
      });
    }
  }

  console.log('🔒 Created staking records (no income)');

  // Create transactions
  const transactionTypes = ['PURCHASE', 'WITHDRAWAL', 'REFERRAL_COMMISSION'];
  const transactionStatuses = ['COMPLETED', 'PENDING', 'FAILED'];
  
  for (const user of users) {
    // Create purchase transactions
    const purchaseCount = Math.floor(Math.random() * 3) + 1;
    for (let i = 0; i < purchaseCount; i++) {
      const amount = Math.floor(Math.random() * 1000) + 100;
      const tokenAmount = amount / 2.80;
      
      await prisma.transaction.create({
        data: {
          userId: user.id,
          type: 'PURCHASE',
          amount,
          tokenAmount,
          pricePerToken: 2.80,
          paymentMethod: ['USDT', 'ETH', 'BTC'][Math.floor(Math.random() * 3)],
          status: 'COMPLETED',
          description: `Token purchase #${i + 1}`,
          processingFee: amount * 0.02, // 2% processing fee
        },
      });
    }

    // Create withdrawal requests (pending due to 3-year lock)
    if (user.availableTokens > 100) {
      const withdrawalAmount = Math.floor(Math.random() * 500) + 100;
      const tokenAmount = withdrawalAmount / 2.80;
      
      await prisma.withdrawalRequest.create({
        data: {
          userId: user.id,
          amount: withdrawalAmount,
          tokenAmount,
          network: ['USDT', 'ETH', 'BTC'][Math.floor(Math.random() * 3)],
          walletAddress: `0x${Math.random().toString(36).substr(2, 40)}`,
          status: 'PENDING',
          lockPeriod: 1095, // 3 years
          canWithdraw: false, // Cannot withdraw yet
        },
      });

      // Create corresponding transaction
      await prisma.transaction.create({
        data: {
          userId: user.id,
          type: 'WITHDRAWAL',
          amount: withdrawalAmount,
          tokenAmount,
          pricePerToken: 2.80,
          paymentMethod: 'withdrawal',
          status: 'PENDING',
          description: 'Withdrawal request (3-year lock)',
          processingFee: 0,
        },
      });
    }
  }

  console.log('💳 Created transactions and withdrawal requests');

  // Create comprehensive token prices for current and future months (dummy data for superadmin to edit)
  const currentDate = new Date();
  
  // Clear existing token prices first
  await prisma.tokenPrice.deleteMany({});
  
  // Create comprehensive price data for current month and next month
  const tokenPrices = [];
  
  // Current month (August 2025) - 31 days
  for (let day = 1; day <= 31; day++) {
    const entryDate = new Date(2025, 7, day); // August is month 7 (0-indexed)
    
    // Generate realistic price progression for current month
    const basePrice = 2.80;
    const dayVariation = (day - 15) * 0.01; // Slight trend based on day of month
    const randomVariation = (Math.random() - 0.5) * 0.08; // ±$0.04 daily variation
    const price = Math.max(2.50, Math.min(3.20, basePrice + dayVariation + randomVariation));
    
    tokenPrices.push({
      price: Math.round(price * 100) / 100, // Round to 2 decimal places
      date: entryDate,
    });
  }
  
  // Next month (September 2025) - 30 days
  for (let day = 1; day <= 30; day++) {
    const entryDate = new Date(2025, 8, day); // September is month 8 (0-indexed)
    
    // Generate realistic price progression for next month (slight upward trend)
    const basePrice = 2.85; // Slightly higher base for next month
    const dayVariation = (day - 15) * 0.008; // Gentler trend
    const randomVariation = (Math.random() - 0.5) * 0.06; // ±$0.03 daily variation
    const price = Math.max(2.60, Math.min(3.30, basePrice + dayVariation + randomVariation));
    
    tokenPrices.push({
      price: Math.round(price * 100) / 100, // Round to 2 decimal places
      date: entryDate,
    });
  }
  
  // Previous month (July 2025) - 31 days for context
  for (let day = 1; day <= 31; day++) {
    const entryDate = new Date(2025, 6, day); // July is month 6 (0-indexed)
    
    // Generate realistic price progression for previous month
    const basePrice = 2.75; // Slightly lower base for previous month
    const dayVariation = (day - 15) * 0.012; // Trend based on day
    const randomVariation = (Math.random() - 0.5) * 0.10; // ±$0.05 daily variation
    const price = Math.max(2.45, Math.min(3.15, basePrice + dayVariation + randomVariation));
    
    tokenPrices.push({
      price: Math.round(price * 100) / 100, // Round to 2 decimal places
      date: entryDate,
    });
  }
  
  // Add today's price with current timestamp
  tokenPrices.push({
    price: 2.80,
    date: currentDate,
  });
  
  await prisma.tokenPrice.createMany({
    data: tokenPrices,
  });

  console.log(`📈 Created ${tokenPrices.length} token price entries (current and future months for superadmin editing)`);

  // Create profile updates history
  for (const user of users) {
    const updateCount = Math.floor(Math.random() * 3) + 1;
    for (let i = 0; i < updateCount; i++) {
      await prisma.profileUpdate.create({
        data: {
          userId: user.id,
          field: ['name', 'contactNumber', 'country', 'state'][Math.floor(Math.random() * 4)],
          oldValue: 'Previous value',
          newValue: 'Updated value',
          updateType: 'PROFILE_UPDATE',
          ipAddress: `192.168.1.${Math.floor(Math.random() * 255) + 1}`,
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });
    }
  }

  console.log('📝 Created profile update history');

  // Create user settings
  for (const user of users) {
          await prisma.userSettings.create({
        data: {
          userId: user.id,
          darkMode: Math.random() > 0.5,
          emailNotifications: true,
          smsNotifications: Math.random() > 0.7,
          marketingEmails: Math.random() > 0.3,
          language: 'en',
          timezone: 'UTC',
        },
      });
  }

  console.log('⚙️  Created user settings');

  // Create password reset records
  for (let i = 0; i < 3; i++) {
    const user = users[Math.floor(Math.random() * users.length)];
    await prisma.passwordReset.create({
      data: {
        email: user.email,
        token: `reset_${Math.random().toString(36).substr(2, 15)}`,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
      },
    });
  }

  console.log('🔑 Created password reset records');

  // Create sample notifications for users
  const notificationTypes = ['SYSTEM', 'TRANSACTION', 'REFERRAL', 'STAKING', 'PROFILE_UPDATE', 'TOKEN_PURCHASE'];
  const sampleNotifications = [
    {
      type: 'SYSTEM',
      title: 'Welcome to Ditokens!',
      message: 'Thank you for joining Ditokens CRM. Your account has been successfully created.',
      icon: '👋',
    },
    {
      type: 'TOKEN_PURCHASE',
      title: 'Token Purchase Successful',
      message: 'You have successfully purchased 1000 DIT tokens for $2,800.00',
      icon: '💰',
    },
    {
      type: 'REFERRAL',
      title: 'Referral Commission Earned',
      message: 'You earned $140.00 commission from a referral\'s token purchase',
      icon: '🎉',
    },
    {
      type: 'STAKING',
      title: 'Staking Rewards Received',
      message: 'You received $29.17 in staking rewards from your 1000 DIT stake',
      icon: '🏆',
    },
    {
      type: 'PROFILE_UPDATE',
      title: 'Profile Updated',
      message: 'Your profile information has been successfully updated',
      icon: '👤',
    },
    {
      type: 'TRANSACTION',
      title: 'Withdrawal Processed',
      message: 'Your withdrawal request of $500.00 has been completed',
      icon: '✅',
    },
  ];

  for (const user of users) {
    // Create 3-5 random notifications for each user
    const notificationCount = Math.floor(Math.random() * 3) + 3;
    
    for (let i = 0; i < notificationCount; i++) {
      const notification = sampleNotifications[Math.floor(Math.random() * sampleNotifications.length)];
      const isRead = Math.random() > 0.3; // 70% chance of being read
      
      await prisma.notification.create({
        data: {
          userId: user.id,
          type: notification.type as any,
          title: notification.title,
          message: notification.message,
          icon: notification.icon,
          isRead,
          createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Random time within last week
        },
      });
    }
  }

  // Create a few notifications for admin
  await prisma.notification.create({
    data: {
      userId: admin.id,
      type: 'ADMIN_MESSAGE',
      title: 'Admin Dashboard Active',
      message: 'Welcome to the admin dashboard. You have full access to manage the Ditokens CRM system.',
      icon: '👨‍💼',
      isRead: false,
    },
  });

  console.log('📬 Created sample notifications');

  console.log('✅ Database seeding completed successfully!');
  console.log('📊 Summary:');
  console.log(`   - Superadmin user: ${superadmin.email}`);
  console.log(`   - Admin user: ${admin.email}`);
  console.log(`   - Regular users: ${users.length}`);
  console.log(`   - Referral commissions created`);
  console.log(`   - Staking records created (no income)`);
  console.log(`   - Transactions created`);
  console.log(`   - Profile updates tracked`);
  console.log(`   - User settings configured`);
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
