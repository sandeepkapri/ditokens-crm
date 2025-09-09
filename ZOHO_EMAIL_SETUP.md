# Zoho Email Setup Guide

Your DiTokens CRM application is now configured to use Zoho email for sending notifications. Here's how to complete the setup:

## 1. Environment Configuration

Create a `.env` file in your project root with the following Zoho email configuration:

```env
# Email Service Configuration
EMAIL_PROVIDER="zoho"
EMAIL_FROM="noreply@ditokens.com"

# Zoho Configuration
ZOHO_SMTP_HOST="smtp.zoho.com"
ZOHO_SMTP_PORT="587"
ZOHO_SMTP_SECURE="false"
ZOHO_EMAIL="your-email@zoho.com"
ZOHO_PASSWORD="your-zoho-app-password"
```

## 2. Zoho Email Setup Steps

### Step 1: Create Zoho Account
1. Go to [Zoho Mail](https://mail.zoho.com)
2. Create a new account or use existing account
3. Verify your email address

### Step 2: Enable App Passwords
1. Log into your Zoho account
2. Go to **Settings** → **Security** → **App Passwords**
3. Generate a new app password for "DiTokens CRM"
4. Copy the generated password (you'll need this for `ZOHO_PASSWORD`)

### Step 3: Configure Domain (Optional)
If you want to use a custom domain:
1. Go to **Settings** → **Domains**
2. Add your domain (e.g., `ditokens.com`)
3. Verify domain ownership
4. Update `EMAIL_FROM` to use your domain

## 3. Testing Your Setup

### Method 1: Using the Test Page
1. Start your development server: `npm run dev`
2. Navigate to: `http://localhost:3000/admin/email-test`
3. Enter your email address
4. Click "Test Connection" to verify SMTP settings
5. Click "Send Test Email" to send a test email

### Method 2: Using API Directly
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

Your application includes the following email templates:

- **Welcome Email**: Sent when users sign up
- **Login Notification**: Sent when users log in (if enabled)
- **Payment Confirmation**: Sent after successful payments
- **Purchase Confirmation**: Sent after token purchases
- **Stake Confirmation**: Sent after staking tokens
- **Password Reset**: Sent for password reset requests
- **General Notifications**: For custom notifications

## 5. Using Email Service in Code

```typescript
import { emailService } from '@/lib/email';
import { EmailEventManager } from '@/lib/email-events';

// Send welcome email
await emailService.sendWelcomeEmail('user@example.com', 'John Doe');

// Send custom notification
await emailService.sendNotification(
  'user@example.com',
  'John Doe',
  'Important Update',
  'Your account has been updated successfully.'
);

// Use event manager for structured events
await EmailEventManager.handleUserSignup('user-id', {
  email: 'user@example.com',
  name: 'John Doe'
});
```

## 6. Troubleshooting

### Common Issues:

1. **"Authentication failed"**
   - Verify your Zoho email and app password
   - Make sure you're using an app password, not your regular password

2. **"Connection timeout"**
   - Check your internet connection
   - Verify Zoho SMTP settings (smtp.zoho.com:587)

3. **"Invalid recipient"**
   - Verify the recipient email address is valid
   - Check if the email is not blocked by spam filters

4. **"Template not found"**
   - Ensure email templates exist in `src/templates/emails/`
   - Check template file naming convention

### Debug Mode:
Add this to your `.env` file to enable detailed logging:
```env
NODE_ENV=development
DEBUG=email:*
```

## 7. Production Considerations

1. **Rate Limiting**: Zoho has sending limits (typically 200 emails/day for free accounts)
2. **Monitoring**: Set up email delivery monitoring
3. **Backup Provider**: Consider adding a backup email provider
4. **Security**: Use environment variables for all credentials
5. **Templates**: Customize email templates to match your brand

## 8. Next Steps

1. Update your `.env` file with actual Zoho credentials
2. Test the email functionality using the test page
3. Customize email templates in `src/templates/emails/`
4. Integrate email sending into your application workflows
5. Set up monitoring and logging for production use

Your Zoho email integration is now ready to use! 🎉
