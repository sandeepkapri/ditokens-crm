#!/usr/bin/env node

/**
 * Test Login Email for Existing User
 * This script tests login email functionality with an existing user
 */

const fetch = require('node-fetch');
require('dotenv').config();

const BASE_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';

async function testLoginWithExistingUser() {
  console.log('🧪 Testing Login Email with Existing User\n');

  // Test with your actual email
  const loginData = {
    email: 'contact@ditokens.com', // Use your actual email
    password: 'your-password-here' // You'll need to provide the actual password
  };

  console.log('⚠️  Note: This test requires your actual password');
  console.log('   Update the password in this script before running\n');

  try {
    console.log('🔐 Testing login...');
    const response = await fetch(`${BASE_URL}/api/auth/sign-in`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'DiTokens-CRM-Test/1.0',
        'X-Forwarded-For': '192.168.1.100'
      },
      body: JSON.stringify(loginData)
    });

    const result = await response.json();

    if (response.ok) {
      console.log('✅ Login successful');
      console.log(`   - User ID: ${result.user.id}`);
      console.log(`   - Email: ${result.user.email}`);
      console.log(`   - Name: ${result.user.name}`);
      console.log('\n📧 Check your email inbox for the login notification!');
      console.log('   - Look for email from: contact@ditokens.com');
      console.log('   - Subject: "Login Notification - DiTokens CRM"');
    } else {
      console.log('❌ Login failed:');
      console.log(`   - Error: ${result.error}`);
      console.log('\n💡 Possible reasons:');
      console.log('   - Wrong password');
      console.log('   - User account is deactivated');
      console.log('   - User doesn\'t exist');
    }
  } catch (error) {
    console.error('❌ Login test failed:', error.message);
  }
}

async function testDirectEmailSending() {
  console.log('\n🧪 Testing Direct Email Sending\n');

  try {
    const response = await fetch(`${BASE_URL}/api/email/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'send-test',
        email: 'contact@ditokens.com',
        name: 'Test User'
      })
    });

    const result = await response.json();

    if (result.success) {
      console.log('✅ Direct email test successful');
      console.log(`   - Message: ${result.message}`);
      console.log('   - Check your email inbox!');
    } else {
      console.log('❌ Direct email test failed:');
      console.log(`   - Error: ${result.error || result.message}`);
    }
  } catch (error) {
    console.error('❌ Direct email test failed:', error.message);
  }
}

async function runTests() {
  console.log('🚀 Login Email Troubleshooting\n');
  console.log(`📍 Testing against: ${BASE_URL}\n`);

  // Test 1: Direct email sending
  await testDirectEmailSending();

  // Test 2: Login with existing user
  await testLoginWithExistingUser();

  console.log('\n🔍 Troubleshooting Steps:');
  console.log('1. ✅ Check if direct email sending works');
  console.log('2. ✅ Test login with your actual credentials');
  console.log('3. ✅ Check console logs for email sending messages');
  console.log('4. ✅ Check spam folder in your email');
  console.log('5. ✅ Verify Zoho App Password is correct');
  
  console.log('\n📧 Expected Email Details:');
  console.log('   - From: contact@ditokens.com');
  console.log('   - Subject: "Login Notification - DiTokens CRM"');
  console.log('   - Content: Login time, IP address, device info');
}

// Run the tests
runTests().catch(console.error);
