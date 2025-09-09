#!/usr/bin/env node

/**
 * Zoho Email Test Script
 * 
 * This script tests your Zoho App Password configuration
 * Run with: node scripts/test-zoho-email.js
 */

const nodemailer = require('nodemailer');
require('dotenv').config();

async function testZohoEmail() {
  console.log('🔧 Testing Zoho Email Configuration...\n');

  // Check environment variables
  const requiredVars = ['ZOHO_EMAIL', 'ZOHO_PASSWORD'];
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingVars.forEach(varName => console.error(`   - ${varName}`));
    console.error('\nPlease set these in your .env file');
    process.exit(1);
  }

  console.log('✅ Environment variables found');
  console.log(`   - ZOHO_EMAIL: ${process.env.ZOHO_EMAIL}`);
  console.log(`   - ZOHO_PASSWORD: ${'*'.repeat(process.env.ZOHO_PASSWORD.length)}`);
  console.log(`   - EMAIL_FROM: ${process.env.EMAIL_FROM || 'Not set'}\n`);

  // Create transporter
  const transporter = nodemailer.createTransport({
    host: process.env.ZOHO_SMTP_HOST || 'smtp.zoho.in',
    port: parseInt(process.env.ZOHO_SMTP_PORT || '587'),
    secure: process.env.ZOHO_SMTP_SECURE === 'true',
    auth: {
      user: process.env.ZOHO_EMAIL,
      pass: process.env.ZOHO_PASSWORD
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  try {
    // Test connection
    console.log('🔌 Testing SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection successful!\n');

    // Test email sending
    const testEmail = process.env.ZOHO_EMAIL; // Send to yourself for testing
    console.log(`📧 Sending test email to ${testEmail}...`);
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.ZOHO_EMAIL,
      to: testEmail,
      subject: 'DiTokens CRM - Zoho Email Test',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">🎉 Zoho Email Test Successful!</h2>
          <p>This is a test email from your DiTokens CRM application.</p>
          <p><strong>Configuration Details:</strong></p>
          <ul>
            <li>Provider: Zoho Mail</li>
            <li>SMTP Host: ${process.env.ZOHO_SMTP_HOST || 'smtp.zoho.com'}</li>
            <li>Port: ${process.env.ZOHO_SMTP_PORT || '587'}</li>
            <li>Security: STARTTLS</li>
            <li>Authentication: App Password</li>
          </ul>
          <p style="color: #059669;">✅ Your Zoho email integration is working correctly!</p>
          <hr style="margin: 20px 0;">
          <p style="color: #6b7280; font-size: 12px;">
            Sent at: ${new Date().toLocaleString()}<br>
            From: DiTokens CRM Email Test Script
          </p>
        </div>
      `,
      text: `
Zoho Email Test Successful!

This is a test email from your DiTokens CRM application.

Configuration Details:
- Provider: Zoho Mail
- SMTP Host: ${process.env.ZOHO_SMTP_HOST || 'smtp.zoho.com'}
- Port: ${process.env.ZOHO_SMTP_PORT || '587'}
- Security: STARTTLS
- Authentication: App Password

✅ Your Zoho email integration is working correctly!

Sent at: ${new Date().toLocaleString()}
From: DiTokens CRM Email Test Script
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Test email sent successfully!');
    console.log(`   Message ID: ${result.messageId}`);
    console.log(`   Response: ${result.response}\n`);

    console.log('🎉 Zoho App Password configuration is working perfectly!');
    console.log('\nNext steps:');
    console.log('1. Check your email inbox for the test message');
    console.log('2. Visit http://localhost:3000/admin/email-test for web testing');
    console.log('3. Start using the email service in your application');

  } catch (error) {
    console.error('❌ Error testing Zoho email:');
    console.error(`   ${error.message}\n`);
    
    if (error.code === 'EAUTH') {
      console.error('🔐 Authentication Error:');
      console.error('   - Make sure you\'re using an App Password, not your regular password');
      console.error('   - Verify 2FA is enabled on your Zoho account');
      console.error('   - Check if the App Password was copied correctly');
    } else if (error.code === 'ECONNECTION') {
      console.error('🌐 Connection Error:');
      console.error('   - Check your internet connection');
      console.error('   - Verify SMTP settings (smtp.zoho.com:587)');
      console.error('   - Check firewall settings');
    } else if (error.code === 'EENVELOPE') {
      console.error('📧 Email Error:');
      console.error('   - Check the recipient email address');
      console.error('   - Verify EMAIL_FROM is set correctly');
    }
    
    console.error('\nTroubleshooting:');
    console.error('1. Double-check your .env file configuration');
    console.error('2. Generate a new App Password if needed');
    console.error('3. Check Zoho Mail security settings');
    console.error('4. Review the ZOHO_APP_PASSWORD_SETUP.md guide');
    
    process.exit(1);
  }
}

// Run the test
testZohoEmail().catch(console.error);
