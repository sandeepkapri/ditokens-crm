import { NextRequest, NextResponse } from 'next/server';
import { emailService } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { action, email, name } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    let result = false;
    let message = '';

    switch (action) {
      case 'test-connection':
        result = await emailService.testConnection();
        message = result ? 'Email connection successful' : 'Email connection failed';
        break;

      case 'send-welcome':
        result = await emailService.sendWelcomeEmail(email, name || 'Test User');
        message = result ? 'Welcome email sent successfully' : 'Failed to send welcome email';
        break;

      case 'send-test':
        result = await emailService.sendNotification(
          email,
          name || 'Test User',
          'Test Email from DiTokens CRM',
          'This is a test email to verify your Zoho email configuration is working correctly.'
        );
        message = result ? 'Test email sent successfully' : 'Failed to send test email';
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: test-connection, send-welcome, or send-test' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: result,
      message,
      action,
      email
    });

  } catch (error) {
    console.error('Email test error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Email test API endpoint',
    availableActions: [
      'test-connection',
      'send-welcome', 
      'send-test'
    ],
    usage: {
      method: 'POST',
      body: {
        action: 'test-connection | send-welcome | send-test',
        email: 'recipient@example.com',
        name: 'Recipient Name (optional)'
      }
    }
  });
}