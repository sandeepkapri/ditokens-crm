const nodemailer = require('nodemailer');
require('dotenv').config();

async function sendAllTestEmails() {
  console.log('🚀 Testing all email types for sandeepkapri.sk@gmail.com\n');
  
  const transporter = nodemailer.createTransport({
    host: 'smtp.zoho.in',
    port: 587,
    secure: false,
    auth: {
      user: process.env.ZOHO_EMAIL,
      pass: process.env.ZOHO_PASSWORD
    }
  });

  const testEmails = [
    {
      type: 'Signup Welcome',
      subject: 'Welcome to DiTokens!',
      html: `
        <h2>Welcome to DiTokens!</h2>
        <p>Dear Sandeep Kapri,</p>
        <p>Thank you for signing up with DiTokens. Your account has been created successfully.</p>
        <p>You can now start trading and managing your tokens.</p>
        <p>Best regards,<br>DiTokens Team</p>
      `
    },
    {
      type: 'Login Notification',
      subject: 'New Login Detected',
      html: `
        <h2>New Login Detected</h2>
        <p>Dear Sandeep Kapri,</p>
        <p>We detected a new login to your DiTokens account.</p>
        <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
        <p><strong>IP Address:</strong> 192.168.1.1</p>
        <p>If this wasn't you, please contact support immediately.</p>
        <p>Best regards,<br>DiTokens Security Team</p>
      `
    },
    {
      type: 'Purchase Confirmation',
      subject: 'Purchase Confirmation - DiTokens',
      html: `
        <h2>Purchase Confirmation</h2>
        <p>Dear Sandeep Kapri,</p>
        <p>Your token purchase has been confirmed!</p>
        <p><strong>Tokens Purchased:</strong> 1,000 DIT</p>
        <p><strong>Amount Paid:</strong> $100.00</p>
        <p><strong>Transaction ID:</strong> TXN123456789</p>
        <p>Thank you for your purchase!</p>
        <p>Best regards,<br>DiTokens Team</p>
      `
    },
    {
      type: 'Stake Confirmation',
      subject: 'Staking Confirmation - DiTokens',
      html: `
        <h2>Staking Confirmation</h2>
        <p>Dear Sandeep Kapri,</p>
        <p>Your tokens have been successfully staked!</p>
        <p><strong>Tokens Staked:</strong> 500 DIT</p>
        <p><strong>Staking Period:</strong> 30 days</p>
        <p><strong>APY:</strong> 12%</p>
        <p>Your rewards will be calculated daily.</p>
        <p>Best regards,<br>DiTokens Team</p>
      `
    },
    {
      type: 'Transaction Failed',
      subject: 'Transaction Failed - DiTokens',
      html: `
        <h2>Transaction Failed</h2>
        <p>Dear Sandeep Kapri,</p>
        <p>We're sorry to inform you that your recent transaction has failed.</p>
        <p><strong>Transaction Type:</strong> Token Purchase</p>
        <p><strong>Amount:</strong> $100.00</p>
        <p><strong>Reason:</strong> Insufficient funds</p>
        <p>Please try again or contact support if you need assistance.</p>
        <p>Best regards,<br>DiTokens Support Team</p>
      `
    }
  ];

  for (const email of testEmails) {
    try {
      console.log(`📧 Sending ${email.type}...`);
      
      const result = await transporter.sendMail({
        from: process.env.ZOHO_EMAIL,
        to: 'sandeepkapri.sk@gmail.com',
        subject: email.subject,
        html: email.html
      });
      
      console.log(`✅ ${email.type} sent successfully! (ID: ${result.messageId})`);
      
      // Wait 2 seconds between emails
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      console.error(`❌ ${email.type} failed:`, error.message);
    }
  }

  console.log('\n🎉 All test emails completed!');
  console.log('📬 Check your email inbox (and spam folder) for the test emails.');
}

sendAllTestEmails();
