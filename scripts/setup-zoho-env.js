#!/usr/bin/env node

/**
 * Zoho Environment Setup Script
 * 
 * This script helps you set up your .env file for Zoho email
 * Run with: node scripts/setup-zoho-env.js
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function setupZohoEnv() {
  console.log('🔧 Zoho Email Environment Setup\n');
  console.log('This script will help you configure your .env file for Zoho email.\n');

  // Check if .env exists
  const envPath = path.join(process.cwd(), '.env');
  const envExists = fs.existsSync(envPath);

  if (envExists) {
    console.log('📄 Found existing .env file');
    const overwrite = await question('Do you want to update the Zoho configuration? (y/n): ');
    if (overwrite.toLowerCase() !== 'y') {
      console.log('Setup cancelled.');
      rl.close();
      return;
    }
  }

  console.log('\n📋 Please provide the following information:\n');

  // Get Zoho email
  const zohoEmail = await question('Zoho Email Address: ');
  if (!zohoEmail || !zohoEmail.includes('@')) {
    console.log('❌ Invalid email address');
    rl.close();
    return;
  }

  // Get App Password
  const appPassword = await question('Zoho App Password: ');
  if (!appPassword) {
    console.log('❌ App Password is required');
    rl.close();
    return;
  }

  // Get sender email
  const senderEmail = await question(`Sender Email (default: ${zohoEmail}): `) || zohoEmail;

  // Get domain for EMAIL_FROM
  const emailFrom = await question(`Email From Address (default: noreply@${zohoEmail.split('@')[1]}): `) || `noreply@${zohoEmail.split('@')[1]}`;

  console.log('\n🔧 Generating .env configuration...\n');

  // Create .env content
  const envContent = `# Database Configuration
DATABASE_URL="mysql://username:password@localhost:3306/ditokens_crm"

# NextAuth Configuration
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"
JWT_SECRET="your-jwt-secret-here"

# Email Service Configuration
EMAIL_PROVIDER="zoho"
EMAIL_FROM="${emailFrom}"

# Zoho App Password Configuration
ZOHO_SMTP_HOST="smtp.zoho.com"
ZOHO_SMTP_PORT="587"
ZOHO_SMTP_SECURE="false"
ZOHO_EMAIL="${zohoEmail}"
ZOHO_PASSWORD="${appPassword}"

# Gmail Configuration (backup)
GMAIL_EMAIL="your-email@gmail.com"
GMAIL_APP_PASSWORD="your-gmail-app-password"

# SendGrid Configuration (backup)
SENDGRID_API_KEY="your-sendgrid-api-key"

# Custom SMTP Configuration (backup)
CUSTOM_SMTP_HOST="smtp.your-provider.com"
CUSTOM_SMTP_PORT="587"
CUSTOM_SMTP_SECURE="false"
CUSTOM_SMTP_USER="your-username"
CUSTOM_SMTP_PASS="your-password"

# Application URLs
DASHBOARD_URL="http://localhost:3000/dashboard"
SUPPORT_EMAIL="support@${zohoEmail.split('@')[1]}"
SECURITY_EMAIL="security@${zohoEmail.split('@')[1]}"
`;

  try {
    // Write .env file
    fs.writeFileSync(envPath, envContent);
    console.log('✅ .env file created/updated successfully!\n');

    console.log('📋 Configuration Summary:');
    console.log(`   - Zoho Email: ${zohoEmail}`);
    console.log(`   - App Password: ${'*'.repeat(appPassword.length)}`);
    console.log(`   - Email From: ${emailFrom}`);
    console.log(`   - SMTP Host: smtp.zoho.com:587`);
    console.log(`   - Security: STARTTLS\n`);

    console.log('🧪 Next Steps:');
    console.log('1. Test your configuration: npm run test:email');
    console.log('2. Start your app: npm run dev');
    console.log('3. Visit: http://localhost:3000/admin/email-test');
    console.log('4. Check the ZOHO_APP_PASSWORD_SETUP.md guide for detailed instructions\n');

    console.log('⚠️  Security Reminders:');
    console.log('   - Never commit your .env file to version control');
    console.log('   - Keep your App Password secure');
    console.log('   - Rotate your App Password regularly\n');

  } catch (error) {
    console.error('❌ Error creating .env file:', error.message);
  }

  rl.close();
}

// Run the setup
setupZohoEnv().catch(console.error);
