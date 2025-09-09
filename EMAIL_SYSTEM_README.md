# DiTokens CRM Email System

A flexible and scalable email system that supports multiple email providers including Zoho, Gmail, SendGrid, custom SMTP, and local sendmail. The system automatically sends emails for various user events and provides customizable email templates.

## Features

- **Multiple Email Providers**: Support for Zoho, Gmail, SendGrid, custom SMTP, and local sendmail
- **Event-Driven**: Automatically sends emails for user signup, login, payments, purchases, staking, and password resets
- **Customizable Templates**: Beautiful, responsive HTML email templates using Handlebars
- **Fallback System**: Built-in fallback templates if custom templates are not found
- **Bulk Notifications**: Send notifications to multiple users at once
- **User Preferences**: Respects user email notification preferences
- **Error Handling**: Comprehensive error handling and logging

## Email Templates

The system includes the following email templates:

1. **Welcome Email** (`welcome.html.hbs`) - Sent when users sign up
2. **Login Notification** (`login-notification.html.hbs`) - Sent for new login events
3. **Payment Confirmation** (`payment-confirmation.html.hbs`) - Sent after successful payments
4. **Purchase Confirmation** (`purchase-confirmation.html.hbs`) - Sent after token purchases
5. **Stake Confirmation** (`stake-confirmation.html.hbs`) - Sent after staking tokens
6. **Password Reset** (`password-reset.html.hbs`) - Sent for password reset requests
7. **General Notification** (`notification.html.hbs`) - Flexible template for various notifications

## Setup Instructions

### 1. Install Dependencies

```bash
npm install nodemailer @types/nodemailer handlebars @types/handlebars
```

### 2. Environment Configuration

Copy `env.example` to `.env` and configure your email provider:

```bash
cp env.example .env
```

#### For Zoho (Recommended)

```env
EMAIL_PROVIDER="zoho"
ZOHO_EMAIL="your-email@zoho.com"
ZOHO_PASSWORD="your-zoho-app-password"
ZOHO_SMTP_HOST="smtp.zoho.com"
ZOHO_SMTP_PORT="587"
ZOHO_SMTP_SECURE="false"
```

#### For Gmail

```env
EMAIL_PROVIDER="gmail"
GMAIL_EMAIL="your-email@gmail.com"
GMAIL_APP_PASSWORD="your-gmail-app-password"
```

#### For SendGrid

```env
EMAIL_PROVIDER="sendgrid"
SENDGRID_API_KEY="your-sendgrid-api-key"
```

#### For Custom SMTP

```env
EMAIL_PROVIDER="custom"
CUSTOM_SMTP_HOST="smtp.your-provider.com"
CUSTOM_SMTP_PORT="587"
CUSTOM_SMTP_SECURE="false"
CUSTOM_SMTP_USER="your-username"
CUSTOM_SMTP_PASS="your-password"
```

#### For Local Sendmail (VPS)

```env
EMAIL_PROVIDER="local"
```

### 3. Email Templates

Templates are located in `src/templates/emails/` and use Handlebars syntax. You can customize them by editing the `.hbs` files.

## Usage Examples

### Basic Email Sending

```typescript
import { emailService } from '@/lib/email';

// Send a custom email
await emailService.sendEmail({
  to: 'user@example.com',
  subject: 'Custom Subject',
  template: 'notification',
  context: {
    name: 'John Doe',
    title: 'Custom Title',
    message: 'Custom message content'
  }
});
```

### Event-Based Email Sending

```typescript
import { 
  sendWelcomeEmail, 
  sendLoginNotification,
  sendPaymentConfirmation 
} from '@/lib/email-events';

// Send welcome email on user signup
await sendWelcomeEmail(userId, {
  email: 'user@example.com',
  name: 'John Doe'
});

// Send login notification
await sendLoginNotification(userId, {
  email: 'user@example.com',
  name: 'John Doe'
}, {
  ipAddress: '192.168.1.1',
  userAgent: 'Mozilla/5.0...',
  timestamp: new Date()
});

// Send payment confirmation
await sendPaymentConfirmation(userId, {
  email: 'user@example.com',
  name: 'John Doe',
  amount: '$100.00',
  transactionId: 'TXN123456',
  paymentMethod: 'Credit Card',
  paymentType: 'Deposit',
  description: 'Account funding',
  processingFee: '$2.50'
});
```

### Bulk Notifications

```typescript
import { sendBulkNotifications } from '@/lib/email-events';

// Send notification to multiple users
const result = await sendBulkNotifications(
  ['user1', 'user2', 'user3'],
  {
    title: 'System Maintenance',
    message: 'We will be performing maintenance on Sunday at 2 AM UTC.',
    priority: 'medium',
    additionalInfo: 'Expected downtime: 2 hours',
    nextSteps: [
      'Save your work before maintenance',
      'Check our status page for updates'
    ],
    tips: [
      'Maintenance is scheduled during low-traffic hours',
      'All data will be preserved'
    ]
  }
);

console.log(`Sent: ${result.successful}, Failed: ${result.failed}`);
```

## Integration with Existing Code

### 1. User Signup

In your signup API route:

```typescript
import { sendWelcomeEmail } from '@/lib/email-events';

// After successful user creation
const user = await prisma.user.create({
  data: userData
});

// Send welcome email
await sendWelcomeEmail(user.id, {
  email: user.email,
  name: user.name
});
```

### 2. User Login

In your login handler:

```typescript
import { sendLoginNotification } from '@/lib/email-events';

// After successful login
await sendLoginNotification(user.id, {
  email: user.email,
  name: user.name
}, {
  ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
  userAgent: request.headers.get('user-agent') || 'unknown',
  timestamp: new Date()
});
```

### 3. Payment Processing

In your payment API:

```typescript
import { sendPaymentConfirmation } from '@/lib/email-events';

// After successful payment
await sendPaymentConfirmation(user.id, {
  email: user.email,
  name: user.name,
  amount: payment.amount,
  transactionId: payment.id,
  paymentMethod: payment.method,
  paymentType: payment.type,
  description: payment.description,
  processingFee: payment.fee
});
```

## Testing

### Test Email Service Connection

```bash
# Test via API
curl -X POST http://localhost:3000/api/email/test

# Or test programmatically
import { testEmailService } from '@/lib/email-events';
const isConnected = await testEmailService();
```

### Test Email Templates

You can test individual templates by calling the email service directly:

```typescript
import { emailService } from '@/lib/email';

// Test welcome email
await emailService.sendWelcomeEmail('test@example.com', 'Test User');

// Test custom email
await emailService.sendEmail({
  to: 'test@example.com',
  subject: 'Test Email',
  template: 'notification',
  context: {
    name: 'Test User',
    title: 'Test Title',
    message: 'This is a test message'
  }
});
```

## Customization

### Adding New Email Templates

1. Create a new `.hbs` file in `src/templates/emails/`
2. Add the template name to the `templateFiles` array in `src/lib/email.ts`
3. Create a corresponding method in the `EmailService` class
4. Add the event handler in `EmailEventManager`

### Modifying Existing Templates

Edit the `.hbs` files in `src/templates/emails/`. The templates use:
- Handlebars for dynamic content
- Inline CSS for email client compatibility
- Responsive design for mobile devices

### Email Provider Switching

To switch email providers, simply change the `EMAIL_PROVIDER` environment variable and update the corresponding credentials. The system will automatically reconfigure itself.

## Troubleshooting

### Common Issues

1. **Email not sending**: Check your email provider credentials and SMTP settings
2. **Templates not loading**: Ensure template files exist in the correct directory
3. **Authentication errors**: Verify your email provider's security settings (2FA, app passwords)
4. **Rate limiting**: Some providers have sending limits; check your provider's documentation

### Debug Mode

Enable debug logging by setting the environment variable:

```env
DEBUG_EMAIL=true
```

### Logs

Check your application logs for email-related errors and success messages.

## Security Considerations

- Never commit `.env` files to version control
- Use app-specific passwords for email providers
- Implement rate limiting for email sending
- Validate email addresses before sending
- Respect user notification preferences

## Performance

- Emails are sent asynchronously to avoid blocking user requests
- Bulk notifications use `Promise.allSettled` for parallel processing
- Failed emails are logged but don't break the application flow
- Consider using a queue system for high-volume email sending

## Support

For issues or questions about the email system:

1. Check the logs for error messages
2. Verify your email provider configuration
3. Test the connection using the test endpoint
4. Review the template syntax and Handlebars documentation

## Future Enhancements

- Email queue system for high-volume sending
- Email analytics and tracking
- A/B testing for email templates
- Advanced personalization and segmentation
- Integration with email marketing platforms
