import nodemailer from 'nodemailer';
import { readFileSync } from 'fs';
import { join } from 'path';
import Handlebars from 'handlebars';

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  tls?: {
    rejectUnauthorized: boolean;
  };
}

export interface EmailTemplate {
  subject: string;
  html: string;
  text?: string;
}

export interface EmailData {
  to: string;
  subject: string;
  template: string;
  context: Record<string, any>;
}

export class EmailService {
  private transporter: nodemailer.Transporter;
  private templates: Map<string, HandlebarsTemplateDelegate> = new Map();

  constructor() {
    this.transporter = this.createTransporter();
    this.loadTemplates();
  }

  private createTransporter(): nodemailer.Transporter {
    const emailProvider = process.env.EMAIL_PROVIDER || 'zeptomail';
    
    switch (emailProvider.toLowerCase()) {
      case 'zeptomail':
        return nodemailer.createTransport({
          host: process.env.ZEPTOMAIL_SMTP_HOST || 'smtp.zeptomail.in',
          port: parseInt(process.env.ZEPTOMAIL_SMTP_PORT || '587'),
          secure: process.env.ZEPTOMAIL_SMTP_SECURE === 'true',
          auth: {
            user: process.env.ZEPTOMAIL_USERNAME || 'emailapikey',
            pass: process.env.ZEPTOMAIL_PASSWORD || ''
          },
          tls: {
            rejectUnauthorized: false
          }
        });

      case 'zoho':
        return nodemailer.createTransport({
          host: process.env.ZOHO_SMTP_HOST || 'smtp.zoho.in',
          port: parseInt(process.env.ZOHO_SMTP_PORT || '587'),
          secure: process.env.ZOHO_SMTP_SECURE === 'true',
          auth: {
            user: process.env.ZOHO_EMAIL || '',
            pass: process.env.ZOHO_PASSWORD || ''
          },
          tls: {
            rejectUnauthorized: false
          }
        });

      case 'gmail':
        return nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.GMAIL_EMAIL || '',
            pass: process.env.GMAIL_APP_PASSWORD || ''
          }
        });

      case 'sendgrid':
        return nodemailer.createTransport({
          host: 'smtp.sendgrid.net',
          port: 587,
          secure: false,
          auth: {
            user: 'apikey',
            pass: process.env.SENDGRID_API_KEY || ''
          }
        });

      case 'custom':
        return nodemailer.createTransport({
          host: process.env.CUSTOM_SMTP_HOST || '',
          port: parseInt(process.env.CUSTOM_SMTP_PORT || '587'),
          secure: process.env.CUSTOM_SMTP_SECURE === 'true',
          auth: {
            user: process.env.CUSTOM_SMTP_USER || '',
            pass: process.env.CUSTOM_SMTP_PASS || ''
          }
        });

      case 'local':
        return nodemailer.createTransport({
          sendmail: true,
          newline: 'unix',
          path: '/usr/sbin/sendmail'
        });

      default:
        throw new Error(`Unsupported email provider: ${emailProvider}`);
    }
  }

  private loadTemplates(): void {
    try {
      const templatesDir = join(process.cwd(), 'src', 'templates', 'emails');
      
      // Load all email templates
      const templateFiles = [
        'welcome',
        'login-notification',
        'payment-confirmation',
        'purchase-confirmation',
        'stake-confirmation',
        'password-reset',
        'notification',
        'account-activated',
        'withdrawal-request',
        'withdrawal-request-admin',
        'withdrawal-approved',
        'withdrawal-rejected',
        'withdrawal-processing-admin',
        'purchase-pending',
        'purchase-pending-admin',
        'user-registration-admin',
        'payment-confirmation-admin',
        'payment-rejection-admin'
      ];

      templateFiles.forEach(templateName => {
        try {
          const htmlPath = join(templatesDir, `${templateName}.html.hbs`);
          const htmlContent = readFileSync(htmlPath, 'utf-8');
          this.templates.set(templateName, Handlebars.compile(htmlContent));
        } catch (error) {
          console.warn(`Template ${templateName} not found, using fallback`);
          this.templates.set(templateName, Handlebars.compile(this.getFallbackTemplate(templateName)));
        }
      });
    } catch (error) {
      console.error('Error loading email templates:', error);
    }
  }

  private getFallbackTemplate(templateName: string): string {
    const fallbackTemplates: Record<string, string> = {
      welcome: `
        <!DOCTYPE html>
        <html>
        <head><title>Welcome</title></head>
        <body>
          <h1>Welcome to DiTokens CRM!</h1>
          <p>Hello {{name}},</p>
          <p>Thank you for joining us!</p>
          <p>Best regards,<br>DiTokens Team</p>
        </body>
        </html>
      `,
      'login-notification': `
        <!DOCTYPE html>
        <html>
        <head><title>Login Notification</title></head>
        <body>
          <h1>Login Notification</h1>
          <p>Hello {{name}},</p>
          <p>Your account was accessed at {{loginTime}} from {{ipAddress}}.</p>
          <p>If this wasn't you, please contact support immediately.</p>
          <p>Best regards,<br>DiTokens Team</p>
        </body>
        </html>
      `,
      'payment-confirmation': `
        <!DOCTYPE html>
        <html>
        <head><title>Payment Confirmation</title></head>
        <body>
          <h1>Payment Confirmation</h1>
          <p>Hello {{name}},</p>
          <p>Your payment of {{amount}} has been confirmed.</p>
          <p>Transaction ID: {{transactionId}}</p>
          <p>Best regards,<br>DiTokens Team</p>
        </body>
        </html>
      `,
      'purchase-confirmation': `
        <!DOCTYPE html>
        <html>
        <head><title>Purchase Confirmation</title></head>
        <body>
          <h1>Purchase Confirmation</h1>
          <p>Hello {{name}},</p>
          <p>Your purchase of {{tokens}} tokens has been confirmed.</p>
          <p>Total Amount: {{amount}}</p>
          <p>Best regards,<br>DiTokens Team</p>
        </body>
        </html>
      `,
      'stake-confirmation': `
        <!DOCTYPE html>
        <html>
        <head><title>Stake Confirmation</title></head>
        <body>
          <h1>Stake Confirmation</h1>
          <p>Hello {{name}},</p>
          <p>Your stake of {{tokens}} tokens has been confirmed.</p>
          <p>Stake Period: {{period}}</p>
          <p>Best regards,<br>DiTokens Team</p>
        </body>
        </html>
      `,
      'password-reset': `
        <!DOCTYPE html>
        <html>
        <head><title>Password Reset</title></head>
        <body>
          <h1>Password Reset Request</h1>
          <p>Hello {{name}},</p>
          <p>Click the link below to reset your password:</p>
          <p><a href="{{resetLink}}">Reset Password</a></p>
          <p>This link expires in {{expiryTime}}.</p>
          <p>Best regards,<br>DiTokens Team</p>
        </body>
        </html>
      `,
      notification: `
        <!DOCTYPE html>
        <html>
        <head><title>Notification</title></head>
        <body>
          <h1>{{title}}</h1>
          <p>Hello {{name}},</p>
          <p>{{message}}</p>
          <p>Best regards,<br>DiTokens Team</p>
        </body>
        </html>
      `,
      'withdrawal-approved': `
        <!DOCTYPE html>
        <html>
        <head><title>Withdrawal Approved</title></head>
        <body>
          <h1>Withdrawal Approved</h1>
          <p>Hello {{name}},</p>
          <p>Your withdrawal request of {{amount}} has been approved and is being processed.</p>
          <p>Network: {{network}}</p>
          <p>Wallet Address: {{walletAddress}}</p>
          <p>Transaction ID: {{transactionId}}</p>
          <p>Processing Time: {{processingTime}}</p>
          <p>Best regards,<br>DiTokens Team</p>
        </body>
        </html>
      `,
      'withdrawal-rejected': `
        <!DOCTYPE html>
        <html>
        <head><title>Withdrawal Request Update</title></head>
        <body>
          <h1>Withdrawal Request Update</h1>
          <p>Hello {{name}},</p>
          <p>Your withdrawal request of {{amount}} has been rejected.</p>
          <p>Reason: {{reason}}</p>
          <p>If you have questions, please contact: {{supportContact}}</p>
          <p>Best regards,<br>DiTokens Team</p>
        </body>
        </html>
      `,
      'withdrawal-processing-admin': `
        <!DOCTYPE html>
        <html>
        <head><title>Withdrawal Processing Admin</title></head>
        <body>
          <h1>Withdrawal {{action}} - {{userName}}</h1>
          <p>User: {{userEmail}}</p>
          <p>Amount: {{amount}}</p>
          <p>Network: {{network}}</p>
          <p>Wallet Address: {{walletAddress}}</p>
          <p>Transaction ID: {{transactionId}}</p>
          <p>Action: {{action}}</p>
          <p>Best regards,<br>DiTokens Team</p>
        </body>
        </html>
      `,
      'user-registration-admin': `
        <!DOCTYPE html>
        <html>
        <head><title>New User Registration</title></head>
        <body>
          <h1>New User Registration</h1>
          <p>A new user has registered:</p>
          <p>Name: {{userName}}</p>
          <p>Email: {{userEmail}}</p>
          <p>Contact: {{contactNumber}}</p>
          <p>Country: {{country}}</p>
          <p>State: {{state}}</p>
          <p>Referral Code: {{referralCode}}</p>
          <p>Registration Time: {{registrationTime}}</p>
          <p>Please review and activate the account if appropriate.</p>
          <p>Best regards,<br>DiTokens Team</p>
        </body>
        </html>
      `,
    };

    return fallbackTemplates[templateName] || fallbackTemplates.notification;
  }

  async sendEmail(emailData: EmailData): Promise<boolean> {
    try {
      const template = this.templates.get(emailData.template);
      if (!template) {
        throw new Error(`Template ${emailData.template} not found`);
      }

      const html = template(emailData.context);
      const text = this.htmlToText(html);

      const mailOptions = {
        from: process.env.EMAIL_FROM || process.env.ZOHO_EMAIL || 'noreply@ditokens.com',
        to: emailData.to,
        subject: emailData.subject,
        html,
        text
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', result.messageId);
      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  }

  private htmlToText(html: string): string {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .trim();
  }

  // Convenience methods for common email types
  async sendWelcomeEmail(email: string, name: string): Promise<boolean> {
    return this.sendEmail({
      to: email,
      subject: 'Welcome to DiTokens CRM!',
      template: 'welcome',
      context: { 
        name,
        dashboardUrl: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard`
      }
    });
  }

  async sendLoginNotification(email: string, name: string, loginTime: string, ipAddress: string): Promise<boolean> {
    return this.sendEmail({
      to: email,
      subject: 'Login Notification - DiTokens CRM',
      template: 'login-notification',
      context: { 
        name, 
        loginTime, 
        ipAddress,
        accountUrl: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard/profile`,
        deviceInfo: 'Unknown Device',
        location: 'Unknown Location'
      }
    });
  }

  async sendPaymentConfirmation(email: string, name: string, amount: string, transactionId: string): Promise<boolean> {
    return this.sendEmail({
      to: email,
      subject: 'Payment Confirmation - DiTokens CRM',
      template: 'payment-confirmation',
      context: { name, amount, transactionId }
    });
  }

  async sendPurchaseConfirmation(
    email: string, 
    name: string, 
    tokens: string, 
    amount: string,
    transactionId?: string,
    paymentMethod?: string,
    tokenPrice?: string,
    processingFee?: string,
    currentValue?: string
  ): Promise<boolean> {
    return this.sendEmail({
      to: email,
      subject: 'Purchase Confirmation - DiTokens CRM',
      template: 'purchase-confirmation',
      context: { 
        name, 
        tokens, 
        amount,
        purchaseDate: new Date().toLocaleDateString(),
        transactionId: transactionId || 'N/A',
        paymentMethod: paymentMethod || 'N/A',
        tokenPrice: tokenPrice || 'N/A',
        processingFee: processingFee || '0',
        currentValue: currentValue || amount,
        dashboardUrl: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard`
      }
    });
  }

  async sendStakeConfirmation(email: string, name: string, tokens: string, period: string): Promise<boolean> {
    return this.sendEmail({
      to: email,
      subject: 'Stake Confirmation - DiTokens CRM',
      template: 'stake-confirmation',
      context: { 
        name, 
        tokens, 
        period,
        stakeDate: new Date().toLocaleDateString(),
        transactionId: 'N/A',
        apy: '12',
        lockPeriod: period,
        totalValue: tokens,
        dailyRewards: '0',
        monthlyRewards: '0',
        totalRewards: '0',
        unlockDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString(),
        dashboardUrl: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard`
      }
    });
  }

  async sendPasswordReset(email: string, name: string, resetLink: string, expiryTime: string): Promise<boolean> {
    return this.sendEmail({
      to: email,
      subject: 'Password Reset Request - DiTokens CRM',
      template: 'password-reset',
      context: { name, resetLink, expiryTime }
    });
  }

  async sendNotification(email: string, name: string, title: string, message: string): Promise<boolean> {
    return this.sendEmail({
      to: email,
      subject: title,
      template: 'notification',
      context: { 
        name, 
        title, 
        message,
        subtitle: '',
        priorityClass: 'medium',
        additionalInfo: '',
        actionRequired: '',
        details: '',
        ctaText: '',
        ctaUrl: '',
        nextSteps: [],
        tips: [],
        deadline: '',
        footerMessage: 'This is an automated notification from DiTokens CRM.'
      }
    });
  }

  async sendWithdrawalRequest(
    email: string, 
    name: string, 
    amount: string, 
    network: string, 
    walletAddress: string, 
    withdrawalId: string
  ): Promise<boolean> {
    return this.sendEmail({
      to: email,
      subject: 'Withdrawal Request Submitted - DiTokens CRM',
      template: 'withdrawal-request',
      context: { 
        name, 
        amount, 
        network, 
        walletAddress, 
        withdrawalId,
        lockPeriod: '3 years',
        estimatedUnlockDate: new Date(Date.now() + 3 * 365 * 24 * 60 * 60 * 1000).toLocaleDateString(),
        dashboardUrl: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard`
      }
    });
  }

  async sendWithdrawalRequestAdmin(
    adminEmail: string,
    userEmail: string,
    userName: string,
    amount: string,
    network: string,
    walletAddress: string,
    withdrawalId: string,
    userBalance: string
  ): Promise<boolean> {
    return this.sendEmail({
      to: adminEmail,
      subject: `New Withdrawal Request - ${userName} (${userEmail})`,
      template: 'withdrawal-request-admin',
      context: { 
        adminEmail,
        userEmail,
        userName,
        amount, 
        network, 
        walletAddress, 
        withdrawalId,
        userBalance,
        lockPeriod: '3 years',
        estimatedUnlockDate: new Date(Date.now() + 3 * 365 * 24 * 60 * 60 * 1000).toLocaleDateString(),
        requestTime: new Date().toLocaleString(),
        adminDashboardUrl: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/admin`
      }
    });
  }

  async sendAccountActivated(
    email: string,
    name: string
  ): Promise<boolean> {
    return this.sendEmail({
      to: email,
      subject: 'Account Activated - Welcome to DiTokens CRM',
      template: 'account-activated',
      context: { 
        name,
        dashboardUrl: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard`
      }
    });
  }

  async sendPurchasePending(
    email: string,
    name: string,
    amount: number,
    tokenAmount: number,
    walletAddress: string,
    transactionId: string,
    paymentMethod: string
  ): Promise<boolean> {
    return this.sendEmail({
      to: email,
      subject: 'Token Purchase Pending - Payment Required',
      template: 'purchase-pending',
      context: {
        name,
        amount,
        tokenAmount,
        walletAddress,
        transactionId,
        paymentMethod,
        dashboardUrl: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard`
      }
    });
  }

  async sendPurchasePendingAdmin(
    adminEmail: string,
    userEmail: string,
    userName: string,
    amount: string,
    tokenAmount: string,
    walletAddress: string,
    transactionId: string,
    paymentMethod: string
  ): Promise<boolean> {
    return this.sendEmail({
      to: adminEmail,
      subject: `New Token Purchase Request - ${userName} (${userEmail})`,
      template: 'purchase-pending-admin',
      context: {
        adminEmail,
        userEmail,
        userName,
        amount,
        tokenAmount,
        walletAddress,
        transactionId,
        paymentMethod,
        dashboardUrl: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard`,
        adminDashboardUrl: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/admin`
      }
    });
  }

  async sendWithdrawalApproved(
    email: string,
    name: string,
    amount: string,
    network: string,
    walletAddress: string,
    transactionId: string,
    processingTime: string
  ): Promise<boolean> {
    return this.sendEmail({
      to: email,
      subject: 'Withdrawal Approved - Funds Processing',
      template: 'withdrawal-approved',
      context: {
        name,
        amount,
        network,
        walletAddress,
        transactionId,
        processingTime,
        supportEmail: process.env.EMAIL_FROM || 'support@ditokens.com',
        dashboardUrl: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard`
      }
    });
  }

  async sendWithdrawalRejected(
    email: string,
    name: string,
    amount: string,
    network: string,
    walletAddress: string,
    transactionId: string,
    reason: string,
    supportContact: string
  ): Promise<boolean> {
    return this.sendEmail({
      to: email,
      subject: 'Withdrawal Request Update',
      template: 'withdrawal-rejected',
      context: {
        name,
        amount,
        network,
        walletAddress,
        transactionId,
        reason,
        supportContact,
        supportEmail: process.env.EMAIL_FROM || 'support@ditokens.com',
        dashboardUrl: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard`
      }
    });
  }

  async sendWithdrawalProcessingAdmin(
    adminEmail: string,
    userName: string,
    userEmail: string,
    amount: string,
    network: string,
    walletAddress: string,
    transactionId: string,
    action: string,
    adminNotes?: string,
    userId?: string
  ): Promise<boolean> {
    // Normalize action to lowercase for comparison
    const normalizedAction = action.toLowerCase();
    const isApproved = normalizedAction === 'approved' || normalizedAction === 'approve';
    
    // Set dynamic styling and content based on action
    const headerColor = isApproved ? '#10b981' : '#ef4444';
    const infoBoxColor = isApproved ? '#ecfdf5' : '#fef2f2';
    const borderColor = isApproved ? '#10b981' : '#ef4444';
    const statusBoxColor = isApproved ? '#ecfdf5' : '#fef2f2';
    const statusIcon = isApproved ? '✅' : '❌';
    const statusTitle = isApproved ? 'Withdrawal Approved Successfully' : 'Withdrawal Rejected';
    const statusDescription = isApproved 
      ? 'The withdrawal request has been approved and is now being processed for transfer to the user\'s wallet.'
      : 'The withdrawal request has been rejected. Please review the reason and contact the user if necessary.';
    const actionTitle = isApproved ? 'Approval Confirmed' : 'Rejection Confirmed';
    const impactDescription = isApproved 
      ? 'User will receive their funds within 1-3 business days. Tokens have been deducted from their account.'
      : 'User\'s tokens remain in their account. They have been notified of the rejection.';
    
    return this.sendEmail({
      to: adminEmail,
      subject: `Withdrawal ${isApproved ? 'Approved' : 'Rejected'} - ${userName}`,
      template: 'withdrawal-processing-admin',
      context: {
        adminEmail,
        userName,
        userEmail,
        amount,
        network,
        walletAddress,
        transactionId,
        action: isApproved ? 'Approved' : 'Rejected',
        adminNotes,
        dashboardUrl: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard`,
        // Template-specific variables
        headerColor,
        infoBoxColor,
        borderColor,
        statusBoxColor,
        statusIcon,
        statusTitle,
        statusDescription,
        actionTitle,
        impactDescription,
        tokenAmount: amount, // Assuming amount is in DIT tokens
        fee: '0.00', // Default fee
        oldStatus: 'PENDING',
        newStatus: isApproved ? 'APPROVED' : 'REJECTED',
        processedBy: 'Admin',
        processedTime: new Date().toLocaleString(),
        reason: adminNotes || (isApproved ? 'Approved by admin' : 'Rejected by admin'),
        emailSent: true,
        requiresAttention: !isApproved,
        attentionMessage: isApproved ? '' : 'User has been notified of rejection. Consider following up if needed.',
        adminDashboardUrl: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/admin`,
        userId: userId || 'unknown'
      }
    });
  }

  async sendUserRegistrationAdmin(
    adminEmail: string,
    userName: string,
    userEmail: string,
    contactNumber: string,
    country: string,
    state: string,
    referralCode: string,
    registrationTime: string,
    referredBy?: string
  ): Promise<boolean> {
    return this.sendEmail({
      to: adminEmail,
      subject: `New User Registration - ${userName} (${userEmail})`,
      template: 'user-registration-admin',
      context: {
        adminEmail,
        userName,
        userEmail,
        contactNumber,
        country,
        state,
        referralCode,
        referredBy,
        registrationTime,
        dashboardUrl: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard`,
        adminDashboardUrl: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/admin`
      }
    });
  }

  async sendPaymentConfirmationAdmin(
    adminEmail: string,
    userName: string,
    userEmail: string,
    amount: string,
    tokenAmount: string,
    transactionId: string,
    paymentMethod: string,
    adminNotes?: string
  ): Promise<boolean> {
    return this.sendEmail({
      to: adminEmail,
      subject: `Payment Confirmed - ${userName} (${userEmail})`,
      template: 'payment-confirmation-admin',
      context: {
        adminEmail,
        userName,
        userEmail,
        amount,
        tokenAmount,
        transactionId,
        paymentMethod,
        adminNotes,
        confirmationTime: new Date().toLocaleString(),
        dashboardUrl: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard`,
        adminDashboardUrl: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/admin`
      }
    });
  }

  async sendPaymentRejectionAdmin(
    adminEmail: string,
    userName: string,
    userEmail: string,
    amount: string,
    tokenAmount: string,
    transactionId: string,
    paymentMethod: string,
    adminNotes?: string
  ): Promise<boolean> {
    return this.sendEmail({
      to: adminEmail,
      subject: `Payment Rejected - ${userName} (${userEmail})`,
      template: 'payment-rejection-admin',
      context: {
        adminEmail,
        userName,
        userEmail,
        amount,
        tokenAmount,
        transactionId,
        paymentMethod,
        adminNotes,
        rejectionTime: new Date().toLocaleString(),
        dashboardUrl: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard`,
        adminDashboardUrl: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/admin`
      }
    });
  }

  // Method to test email configuration
  async testConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      console.log('Email service connection verified successfully');
      return true;
    } catch (error) {
      console.error('Email service connection failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const emailService = new EmailService();
