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
  await prisma.user.deleteMany();

  console.log('🗑️  Cleared existing data');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.create({
    data: {
      name: 'Ditokens Admin',
      email: 'admin@ditokens.com',
      password: adminPassword,
      contactNumber: '+1 (555) 123-4567',
      country: 'United States',
      state: 'California',
      role: 'SUPERADMIN',
      isActive: true,
      emailVerified: true,
      referralCode: 'ADMIN001',
      totalTokens: 1000000,
      stakedTokens: 500000,
      availableTokens: 500000,
      totalEarnings: 25000,
      referralEarnings: 5000,
      profilePicture: null, // Admin uses default avatar
    },
  });

  console.log('👑 Created admin user:', admin.email);

  // Create regular users
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
      totalEarnings: 1250,
      referralEarnings: 250,
    },
    {
      name: 'Jane Smith',
      email: 'jane.smith@example.com',
      contactNumber: '+1 (555) 222-2222',
      country: 'United Kingdom',
      state: 'London',
      totalTokens: 8000,
      stakedTokens: 5000,
      availableTokens: 3000,
      totalEarnings: 2000,
      referralEarnings: 400,
    },
    {
      name: 'Mike Johnson',
      email: 'mike.johnson@example.com',
      contactNumber: '+1 (555) 333-3333',
      country: 'Canada',
      state: 'Ontario',
      totalTokens: 3000,
      stakedTokens: 1500,
      availableTokens: 1500,
      totalEarnings: 750,
      referralEarnings: 150,
    },
    {
      name: 'Sarah Wilson',
      email: 'sarah.wilson@example.com',
      contactNumber: '+1 (555) 444-4444',
      country: 'Australia',
      state: 'New South Wales',
      totalTokens: 12000,
      stakedTokens: 8000,
      availableTokens: 4000,
      totalEarnings: 3000,
      referralEarnings: 600,
    },
    {
      name: 'David Brown',
      email: 'david.brown@example.com',
      contactNumber: '+1 (555) 555-5555',
      country: 'Germany',
      state: 'Bavaria',
      totalTokens: 6000,
      stakedTokens: 4000,
      availableTokens: 2000,
      totalEarnings: 1500,
      referralEarnings: 300,
    },
    {
      name: 'Emma Davis',
      email: 'emma.davis@example.com',
      contactNumber: '+1 (555) 666-6666',
      country: 'United States',
      state: 'Texas',
      totalTokens: 4000,
      stakedTokens: 2000,
      availableTokens: 2000,
      totalEarnings: 1000,
      referralEarnings: 200,
    },
    {
      name: 'Alex Taylor',
      email: 'alex.taylor@example.com',
      contactNumber: '+1 (555) 777-7777',
      country: 'United Kingdom',
      state: 'Manchester',
      totalTokens: 7000,
      stakedTokens: 3500,
      availableTokens: 3500,
      totalEarnings: 1750,
      referralEarnings: 350,
    },
    {
      name: 'Lisa Garcia',
      email: 'lisa.garcia@example.com',
      contactNumber: '+1 (555) 888-8888',
      country: 'Spain',
      state: 'Madrid',
      totalTokens: 9000,
      stakedTokens: 6000,
      availableTokens: 3000,
      totalEarnings: 2250,
      referralEarnings: 450,
    },
    {
      name: 'Tom Anderson',
      email: 'tom.anderson@example.com',
      contactNumber: '+1 (555) 999-9999',
      country: 'Netherlands',
      state: 'North Holland',
      totalTokens: 5500,
      stakedTokens: 3000,
      availableTokens: 2500,
      totalEarnings: 1375,
      referralEarnings: 275,
    },
    {
      name: 'Maria Rodriguez',
      email: 'maria.rodriguez@example.com',
      contactNumber: '+1 (555) 000-0000',
      country: 'Italy',
      state: 'Lombardy',
      totalTokens: 6500,
      stakedTokens: 4000,
      availableTokens: 2500,
      totalEarnings: 1625,
      referralEarnings: 325,
    },
  ];

  for (const userInfo of userData) {
    const password = await bcrypt.hash('password123', 12);
    const referralCode = `REF${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    
    const user = await prisma.user.create({
      data: {
        ...userInfo,
        password,
        role: 'USER',
        isActive: true,
        emailVerified: true,
        referralCode,
        referredBy: admin.referralCode, // All users referred by admin for demo
        profilePicture: null, // Uses default avatar
      },
    });
    users.push(user);
  }

  console.log('👥 Created', users.length, 'regular users');

  // Create referral relationships and commissions
  for (let i = 0; i < users.length; i++) {
    const referrer = users[i];
    const referredUser = users[(i + 1) % users.length];
    
    if (referrer.id !== referredUser.id) {
      // Create referral commission
      const commissionAmount = (referredUser.totalTokens * 2.80 * 0.05) / 100; // 5% commission
      
      await prisma.referralCommission.create({
        data: {
          referrerId: referrer.id,
          referredUserId: referredUser.id,
          amount: commissionAmount,
          tokenAmount: referredUser.totalTokens * 0.05, // 5% of tokens
          pricePerToken: 2.80,
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

  // Create staking records
  for (const user of users) {
    if (user.stakedTokens > 0) {
      await prisma.stakingRecord.create({
        data: {
          userId: user.id,
          amount: user.stakedTokens,
          apy: 12.5,
          startDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000), // Random start date within last year
          endDate: new Date(Date.now() + (3 * 365 * 24 * 60 * 60 * 1000)), // 3 years from now
          status: 'ACTIVE',
          rewards: (user.stakedTokens * 2.80 * 0.125) / 12, // Monthly rewards
        },
      });
    }
  }

  console.log('🔒 Created staking records');

  // Create transactions
  const transactionTypes = ['PURCHASE', 'WITHDRAWAL', 'REFERRAL_COMMISSION', 'REWARD'];
  const transactionStatuses = ['COMPLETED', 'PENDING', 'FAILED'];
  
  for (const user of users) {
    // Token purchase transactions
    const purchaseCount = Math.floor(Math.random() * 5) + 1;
    for (let i = 0; i < purchaseCount; i++) {
      const amount = Math.floor(Math.random() * 1000) + 100;
      const tokens = Math.floor(amount / 2.80);
      
      await prisma.transaction.create({
        data: {
          userId: user.id,
          type: 'PURCHASE',
          amount: amount,
          tokenAmount: tokens,
          pricePerToken: 2.80,
          status: 'COMPLETED',
          description: `Token purchase - ${tokens} DIT`,
          paymentMethod: 'USDT',
          processingFee: amount * 0.01, // 1% fee
        },
      });
    }

    // Withdrawal transactions
    if (user.totalEarnings > 100) {
      const withdrawalAmount = Math.min(user.totalEarnings * 0.3, 500); // 30% of earnings, max $500
      
      await prisma.transaction.create({
        data: {
          userId: user.id,
          type: 'WITHDRAWAL',
          amount: withdrawalAmount,
          tokenAmount: 0, // No tokens for withdrawal
          pricePerToken: 2.80,
          status: Math.random() > 0.2 ? 'COMPLETED' : 'PENDING',
          description: 'USDT withdrawal request',
          paymentMethod: 'USDT',
          processingFee: withdrawalAmount * 0.005, // 0.5% fee
        },
      });
    }

    // Referral commission transactions
    if (user.referralEarnings > 0) {
      await prisma.transaction.create({
        data: {
          userId: user.id,
          type: 'REFERRAL',
          amount: user.referralEarnings,
          tokenAmount: user.referralEarnings / 2.80, // Convert to tokens
          pricePerToken: 2.80,
          status: 'COMPLETED',
          description: 'Referral commission payment',
          paymentMethod: 'TOKENS',
          processingFee: 0,
        },
      });
    }

    // Staking reward transactions
    if (user.stakedTokens > 0) {
      const monthlyReward = (user.stakedTokens * 2.80 * 0.125) / 12;
      await prisma.transaction.create({
        data: {
          userId: user.id,
          type: 'REWARD',
          amount: monthlyReward,
          tokenAmount: monthlyReward / 2.80, // Convert to tokens
          pricePerToken: 2.80,
          status: 'COMPLETED',
          description: 'Monthly staking rewards',
          paymentMethod: 'TOKENS',
          processingFee: 0,
        },
      });
    }
  }

  console.log('💳 Created transactions');

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
  console.log(`   - Admin user: ${admin.email}`);
  console.log(`   - Regular users: ${users.length}`);
  console.log(`   - Referral commissions created`);
  console.log(`   - Staking records created`);
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
