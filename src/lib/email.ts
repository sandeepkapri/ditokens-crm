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
    const emailProvider = process.env.EMAIL_PROVIDER || 'zoho';
    
    switch (emailProvider.toLowerCase()) {
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
        'notification'
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
      `
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
      context: { name }
    });
  }

  async sendLoginNotification(email: string, name: string, loginTime: string, ipAddress: string): Promise<boolean> {
    return this.sendEmail({
      to: email,
      subject: 'Login Notification - DiTokens CRM',
      template: 'login-notification',
      context: { name, loginTime, ipAddress }
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

  async sendPurchaseConfirmation(email: string, name: string, tokens: string, amount: string): Promise<boolean> {
    return this.sendEmail({
      to: email,
      subject: 'Purchase Confirmation - DiTokens CRM',
      template: 'purchase-confirmation',
      context: { name, tokens, amount }
    });
  }

  async sendStakeConfirmation(email: string, name: string, tokens: string, period: string): Promise<boolean> {
    return this.sendEmail({
      to: email,
      subject: 'Stake Confirmation - DiTokens CRM',
      template: 'stake-confirmation',
      context: { name, tokens, period }
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
      context: { name, title, message }
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
