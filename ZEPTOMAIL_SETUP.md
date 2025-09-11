# ZeptoMail Email Setup Guide

Your DiTokens CRM application is now configured to use ZeptoMail for sending notifications. Here's how to complete the setup:

## 1. Environment Configuration

Your `.env` file should contain the following ZeptoMail configuration:

```env
# Email Service Configuration
EMAIL_PROVIDER="zeptomail"
EMAIL_FROM="noreply@ditokens.com"

# ZeptoMail Configuration
ZEPTOMAIL_SMTP_HOST="smtp.zeptomail.in"
ZEPTOMAIL_SMTP_PORT="587"
ZEPTOMAIL_SMTP_SECURE="false"
ZEPTOMAIL_USERNAME="emailapikey"
ZEPTOMAIL_PASSWORD="your-zeptomail-api-key"
```

## 2. ZeptoMail Setup Steps

### Step 1: Create ZeptoMail Account
1. Go to [ZeptoMail](https://zeptomail.com)
2. Create a new account or use existing account
3. Verify your email address

### Step 2: Get API Key
1. Log into your ZeptoMail account
2. Go to **Settings** → **API Keys**
3. Generate a new API key for "DiTokens CRM"
4. Copy the generated API key (you'll need this for `ZEPTOMAIL_PASSWORD`)

### Step 3: Configure Domain (Optional)
If you want to use a custom domain:
1. Go to **Settings** → **Domains**
2. Add your domain (e.g., `ditokens.com`)
3. Verify domain ownership
4. Update `EMAIL_FROM` to use your domain

## 3. Testing Your Setup

### Method 1: Using the Test Script
```bash
# Test ZeptoMail configuration
node test-zeptomail.js
```

### Method 2: Using the Test Page
1. Start your development server: `npm run dev`
2. Navigate to: `http://localhost:3000/admin/email-test`
3. Enter your email address
4. Click "Test Connection" to verify SMTP settings
5. Click "Send Test Email" to send a test email

### Method 3: Using API Directly
```bash
# Test connection
curl -X POST http://localhost:3000/api/email/test \
  -H "Content-Type: application/json" \
  -d '{"action": "test-connection", "email": "test@example.com"}'

# Send test email
curl -X POST http://localhost:3000/api/email/test \
  -H "Content-Type: application/json" \
  -d '{"action": "send-test", "email": "test@example.com", "name": "Test User"}'
```

## 4. Available Email Templates

The following email templates are available:

| Template | Description | Usage |
|----------|-------------|-------|
| `welcome` | Welcome email for new users | User registration |
| `login` | Login notification | User login |
| `payment` | Payment confirmation | Payment processing |
| `purchase` | Purchase confirmation | Token purchase |
| `stake` | Stake confirmation | Token staking |
| `withdrawal` | Withdrawal confirmation | Token withdrawal |
| `password-reset` | Password reset | Password reset flow |
| `notification` | General notification | Admin notifications |

## 5. Email Service Features

- ✅ **SMTP Configuration**: Secure SMTP connection with TLS
- ✅ **Template System**: Handlebars-based email templates
- ✅ **Multiple Providers**: Support for ZeptoMail, Zoho, Gmail, SendGrid, and custom SMTP
- ✅ **Connection Testing**: Built-in connection testing functionality
- ✅ **Error Handling**: Comprehensive error handling and logging
- ✅ **Bulk Emails**: Support for sending bulk notifications

## 6. Troubleshooting

### Common Issues

1. **Connection Failed**
   - Verify your API key is correct
   - Check if your account is active
   - Ensure SMTP settings are correct

2. **Authentication Error**
   - Verify `ZEPTOMAIL_USERNAME` is set to "emailapikey"
   - Check if `ZEPTOMAIL_PASSWORD` contains your API key
   - Ensure API key has proper permissions

3. **Email Not Delivered**
   - Check spam folder
   - Verify sender domain is configured
   - Check ZeptoMail delivery logs

### Support

For ZeptoMail-specific issues:
- Visit [ZeptoMail Support](https://zeptomail.com/support)
- Check [ZeptoMail Documentation](https://zeptomail.com/docs)

For application-specific issues:
- Check the application logs
- Verify environment configuration
- Test with the provided test scripts

## 7. Migration from Zoho

If you're migrating from Zoho to ZeptoMail:

1. Update `EMAIL_PROVIDER` to "zeptomail"
2. Replace Zoho credentials with ZeptoMail credentials
3. Test the configuration using the test script
4. Verify all email functionality works as expected

The application will automatically use ZeptoMail when `EMAIL_PROVIDER` is set to "zeptomail".
