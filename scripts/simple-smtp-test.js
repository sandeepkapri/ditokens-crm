#!/usr/bin/env node

/**
 * Simple SMTP Test for Zoho
 * This script tests the basic SMTP connection without sending emails
 */

const nodemailer = require('nodemailer');
require('dotenv').config();

async function testSMTP() {
  console.log('🔧 Simple SMTP Connection Test\n');

  // Display current configuration
  console.log('📋 Current Configuration:');
  console.log(`   - Email: ${process.env.ZOHO_EMAIL}`);
  console.log(`   - Password: ${process.env.ZOHO_PASSWORD ? '***' + process.env.ZOHO_PASSWORD.slice(-4) : 'Not set'}`);
  console.log(`   - Host: ${process.env.ZOHO_SMTP_HOST || 'smtp.zoho.in'}`);
  console.log(`   - Port: ${process.env.ZOHO_SMTP_PORT || '587'}\n`);

  // Create transporter
  const transporter = nodemailer.createTransport({
    host: process.env.ZOHO_SMTP_HOST || 'smtp.zoho.in',
    port: parseInt(process.env.ZOHO_SMTP_PORT || '587'),
    secure: false, // Use STARTTLS
    auth: {
      user: process.env.ZOHO_EMAIL,
      pass: process.env.ZOHO_PASSWORD
    },
    tls: {
      rejectUnauthorized: false
    },
    debug: true, // Enable debug output
    logger: true  // Enable logging
  });

  try {
    console.log('🔌 Testing SMTP connection...');
    console.log('   (This may take a few seconds)\n');
    
    const result = await transporter.verify();
    
    if (result) {
      console.log('✅ SMTP connection successful!');
      console.log('   Your Zoho App Password is working correctly.\n');
      
      console.log('🎉 Next steps:');
      console.log('1. Run: npm run test:email');
      console.log('2. Or visit: http://localhost:3000/admin/email-test');
      console.log('3. Start using the email service in your app');
    }
    
  } catch (error) {
    console.log('❌ SMTP connection failed:');
    console.log(`   Error: ${error.message}\n`);
    
    if (error.code === 'EAUTH') {
      console.log('🔐 Authentication Error Details:');
      console.log('   - This usually means the App Password is incorrect');
      console.log('   - Or 2FA is not enabled on your Zoho account\n');
      
      console.log('🛠️  Troubleshooting Steps:');
      console.log('1. Go to mail.zoho.com and log in');
      console.log('2. Go to Settings → Security → App Passwords');
      console.log('3. Delete any existing "DiTokens CRM" password');
      console.log('4. Create a new App Password:');
      console.log('   - Name: "DiTokens CRM"');
      console.log('   - Description: "Email sending for CRM"');
      console.log('5. Copy the new password and update your .env file');
      console.log('6. Make sure 2FA is enabled on your account\n');
      
      console.log('📝 Current .env should look like:');
      console.log('   ZOHO_EMAIL="contact@ditokens.com"');
      console.log('   ZOHO_PASSWORD="your-new-16-character-password"');
      
    } else if (error.code === 'ECONNECTION') {
      console.log('🌐 Connection Error:');
      console.log('   - Check your internet connection');
      console.log('   - Verify SMTP settings');
      console.log('   - Check firewall settings');
    }
  }
}

testSMTP().catch(console.error);
