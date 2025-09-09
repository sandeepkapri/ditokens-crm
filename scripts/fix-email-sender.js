#!/usr/bin/env node

/**
 * Fix Email Sender Configuration
 * This script helps you update the EMAIL_FROM to use your verified Zoho email
 */

const fs = require('fs');
const path = require('path');

function fixEmailSender() {
  console.log('🔧 Fixing Email Sender Configuration\n');

  const envPath = path.join(process.cwd(), '.env');
  
  if (!fs.existsSync(envPath)) {
    console.log('❌ .env file not found');
    return;
  }

  // Read current .env file
  let envContent = fs.readFileSync(envPath, 'utf8');
  
  console.log('📋 Current Configuration:');
  console.log(`   - ZOHO_EMAIL: ${process.env.ZOHO_EMAIL || 'Not set'}`);
  console.log(`   - EMAIL_FROM: ${process.env.EMAIL_FROM || 'Not set'}\n`);

  // Update EMAIL_FROM to use ZOHO_EMAIL
  const updatedContent = envContent.replace(
    /EMAIL_FROM="[^"]*"/,
    `EMAIL_FROM="${process.env.ZOHO_EMAIL || 'contact@ditokens.com'}"`
  );

  // Write updated .env file
  fs.writeFileSync(envPath, updatedContent);
  
  console.log('✅ Updated .env file:');
  console.log(`   - EMAIL_FROM is now set to: ${process.env.ZOHO_EMAIL || 'contact@ditokens.com'}\n`);
  
  console.log('🎯 This fixes the "553 Relaying disallowed" error because:');
  console.log('   - Zoho only allows sending from verified email addresses');
  console.log('   - Using your ZOHO_EMAIL as sender ensures it\'s verified');
  console.log('   - This is a common requirement for SMTP providers\n');
  
  console.log('🧪 Next Steps:');
  console.log('1. Run: npm run test:email');
  console.log('2. Check your email inbox for the test message');
  console.log('3. Your email system should now work perfectly!');
}

fixEmailSender();
