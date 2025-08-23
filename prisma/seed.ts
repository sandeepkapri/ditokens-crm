import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create initial token price
  const initialTokenPrice = await prisma.tokenPrice.create({
    data: {
      price: 2.80,
      date: new Date(),
    },
  });
  console.log('✅ Created initial token price:', initialTokenPrice);

  // Create system settings
  const systemSettings = await prisma.systemSettings.createMany({
    data: [
      {
        key: 'TOTAL_TOKEN_SUPPLY',
        value: '50000000',
        description: 'Total supply of DIT tokens',
      },
      {
        key: 'STARTING_TOKEN_PRICE',
        value: '2.80',
        description: 'Starting price of DIT tokens in USD',
      },
      {
        key: 'REFERRAL_COMMISSION_RATE',
        value: '0.05',
        description: 'Referral commission rate (5%)',
      },
      {
        key: 'MINIMUM_STAKING_PERIOD',
        value: '1095',
        description: 'Minimum staking period in days (3 years)',
      },
    ],
  });
  console.log('✅ Created system settings:', systemSettings);

  // Create a superadmin user
  const superadmin = await prisma.user.create({
    data: {
      name: 'Super Admin',
      email: 'admin@ditokens.com',
      contactNumber: '+1234567890',
      country: 'US',
      state: 'California',
      password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8HqJqGm', // password: admin123
      role: 'SUPERADMIN',
      referralCode: 'ADMIN001',
      emailVerified: true,
    },
  });
  console.log('✅ Created superadmin user:', superadmin.email);

  console.log('🎉 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
