# Zoho App Password Setup Guide

This guide will walk you through setting up Zoho App Password authentication for your DiTokens CRM email system.

## 🔐 **What is App Password?**

App Password is a secure authentication method that:
- ✅ Works with 2FA enabled accounts
- ✅ Is application-specific (can be revoked individually)
- ✅ More secure than using your main password
- ✅ Perfect for server-to-server email sending

## 📋 **Prerequisites**

- Zoho Mail account
- 2FA enabled on your Zoho account (recommended)
- Access to your project's `.env` file

## 🚀 **Step-by-Step Setup**

### Step 1: Enable Two-Factor Authentication (2FA)

1. **Log into Zoho Mail**
   - Go to [mail.zoho.com](https://mail.zoho.com)
   - Sign in with your credentials

2. **Navigate to Security Settings**
   - Click on your profile picture (top right)
   - Select **Settings**
   - Go to **Security** tab

3. **Enable 2FA**
   - Find **Two-Factor Authentication**
   - Click **Enable**
   - Follow the setup process (SMS or Authenticator app)
   - Save your backup codes securely

### Step 2: Generate App Password

1. **Go to App Passwords Section**
   - In the same **Security** tab
   - Scroll down to **App Passwords**
   - Click **Generate New Password**

2. **Create App Password**
   - **Application Name**: `DiTokens CRM`
   - **Description**: `Email sending for DiTokens CRM application`
   - Click **Generate**

3. **Copy the Password**
   - **IMPORTANT**: Copy the generated password immediately
   - This password will only be shown once
   - Store it securely (password manager recommended)

### Step 3: Configure Environment Variables

Create or update your `.env` file with the following:

```env
# Email Service Configuration
EMAIL_PROVIDER="zoho"
EMAIL_FROM="noreply@ditokens.com"

# Zoho App Password Configuration
ZOHO_SMTP_HOST="smtp.zoho.com"
ZOHO_SMTP_PORT="587"
ZOHO_SMTP_SECURE="false"
ZOHO_EMAIL="your-email@zoho.com"
ZOHO_PASSWORD="your-generated-app-password"
```

**Replace:**
- `your-email@zoho.com` with your actual Zoho email
- `your-generated-app-password` with the app password you just created
- `noreply@ditokens.com` with your preferred sender email

### Step 4: Test the Configuration

1. **Start your development server**
   ```bash
   npm run dev
   ```

2. **Test via Web Interface**
   - Go to `http://localhost:3000/admin/email-test`
   - Enter your email address
   - Click **Test Connection**
   - If successful, click **Send Test Email**

3. **Test via API**
   ```bash
   curl -X POST http://localhost:3000/api/email/test \
     -H "Content-Type: application/json" \
     -d '{"action": "test-connection", "email": "your-email@zoho.com"}'
   ```

## 🔧 **Configuration Details**

### SMTP Settings Used:
- **Host**: `smtp.zoho.com`
- **Port**: `587`
- **Security**: `STARTTLS` (not SSL)
- **Authentication**: App Password

### Security Features:
- ✅ TLS encryption for email transmission
- ✅ App-specific password (not main account password)
- ✅ Can be revoked without affecting main account
- ✅ Works with 2FA enabled

## 🛠️ **Troubleshooting**

### Common Issues:

1. **"Authentication failed"**
   - ✅ Verify you're using the App Password, not your main password
   - ✅ Check that 2FA is enabled on your account
   - ✅ Ensure the App Password was copied correctly

2. **"Connection timeout"**
   - ✅ Check your internet connection
   - ✅ Verify SMTP settings (smtp.zoho.com:587)
   - ✅ Check firewall settings

3. **"Invalid recipient"**
   - ✅ Verify the recipient email address
   - ✅ Check if the email is not blocked by spam filters

4. **"App Password not working"**
   - ✅ Regenerate the App Password
   - ✅ Make sure 2FA is enabled
   - ✅ Check if the password was copied correctly

### Debug Steps:

1. **Check Environment Variables**
   ```bash
   # Make sure these are set correctly
   echo $ZOHO_EMAIL
   echo $ZOHO_PASSWORD
   ```

2. **Test SMTP Connection**
   ```bash
   # Test connection using telnet
   telnet smtp.zoho.com 587
   ```

3. **Check Logs**
   - Look at your application logs for detailed error messages
   - Enable debug mode by adding `DEBUG=email:*` to your `.env`

## 🔒 **Security Best Practices**

1. **Never commit `.env` file**
   - Add `.env` to your `.gitignore`
   - Use environment variables in production

2. **Rotate App Passwords regularly**
   - Generate new App Passwords every 3-6 months
   - Revoke old ones when no longer needed

3. **Use specific App Passwords**
   - Create separate App Passwords for different environments
   - Use descriptive names for easy identification

4. **Monitor App Password usage**
   - Check Zoho security logs regularly
   - Revoke suspicious or unused passwords

## 📊 **Production Considerations**

1. **Rate Limits**
   - Free Zoho accounts: ~200 emails/day
   - Paid accounts: Higher limits
   - Consider upgrading if you need more

2. **Monitoring**
   - Set up email delivery monitoring
   - Track bounce rates and delivery success

3. **Backup Provider**
   - Consider adding a backup email provider
   - Implement failover logic

## ✅ **Verification Checklist**

- [ ] 2FA enabled on Zoho account
- [ ] App Password generated and copied
- [ ] `.env` file configured correctly
- [ ] Test connection successful
- [ ] Test email sent and received
- [ ] App Password stored securely
- [ ] `.env` added to `.gitignore`

## 🎉 **You're All Set!**

Your Zoho App Password authentication is now configured and ready to use. Your DiTokens CRM can now send emails securely using Zoho's SMTP service.

**Next Steps:**
1. Test the email functionality
2. Customize email templates
3. Integrate email sending into your application workflows
4. Set up monitoring for production use

Need help? Check the troubleshooting section or test your configuration using the provided test endpoints.
