import { NextRequest, NextResponse } from "next/server";
import { emailService } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, email, name } = body;

    if (!email || !name) {
      return NextResponse.json(
        { error: "Email and name are required" },
        { status: 400 }
      );
    }

    let result = false;
    let message = "";

    switch (type) {
      case 'signup':
        result = await emailService.sendWelcomeEmail(email, name);
        message = result ? "Welcome email sent successfully" : "Failed to send welcome email";
        break;
        
      case 'login':
        result = await emailService.sendLoginNotification(
          email,
          name,
          new Date().toLocaleString(),
          '192.168.1.1'
        );
        message = result ? "Login notification sent successfully" : "Failed to send login notification";
        break;
        
      case 'purchase':
        result = await emailService.sendPurchaseConfirmation(
          email,
          name,
          '1000',
          '100.00'
        );
        message = result ? "Purchase confirmation sent successfully" : "Failed to send purchase confirmation";
        break;
        
      case 'stake':
        result = await emailService.sendStakeConfirmation(
          email,
          name,
          '500',
          '30 days'
        );
        message = result ? "Stake confirmation sent successfully" : "Failed to send stake confirmation";
        break;
        
      case 'payment':
        result = await emailService.sendPaymentConfirmation(
          email,
          name,
          '100.00',
          'TXN123456789'
        );
        message = result ? "Payment confirmation sent successfully" : "Failed to send payment confirmation";
        break;
        
      case 'password-reset':
        result = await emailService.sendPasswordReset(
          email,
          name,
          'https://ditokens.com/reset?token=test123',
          '24 hours'
        );
        message = result ? "Password reset email sent successfully" : "Failed to send password reset email";
        break;
        
      case 'notification':
        result = await emailService.sendNotification(
          email,
          name,
          'Test Notification',
          'This is a test notification message.'
        );
        message = result ? "Notification sent successfully" : "Failed to send notification";
        break;
        
      case 'account-activated':
        result = await emailService.sendAccountActivated(email, name);
        message = result ? "Account activation email sent successfully" : "Failed to send account activation email";
        break;
        
      case 'purchase-pending-admin':
        const { userEmail, userName, amount, tokenAmount, walletAddress, transactionId, paymentMethod } = body;
        result = await emailService.sendPurchasePendingAdmin(
          email,
          userEmail || 'test@example.com',
          userName || 'Test User',
          amount || '100',
          tokenAmount || '35.71',
          walletAddress || '0x7E874A697007965c6A3DdB1702828A764E7a91c3',
          transactionId || 'test-123',
          paymentMethod || 'usdt'
        );
        message = result ? "Purchase pending admin email sent successfully" : "Failed to send purchase pending admin email";
        break;
        
      case 'connection':
        result = await emailService.testConnection();
        message = result ? "Email service connection successful" : "Email service connection failed";
        break;
        
      default:
        return NextResponse.json(
          { error: "Invalid email type. Use: signup, login, purchase, stake, payment, password-reset, notification, account-activated, or connection" },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: result,
      message,
      type,
      email,
      name
    });

  } catch (error) {
    console.error("Email test error:", error);
    return NextResponse.json(
      { 
        success: false,
        error: "Internal server error",
        details: error.message 
      },
      { status: 500 }
    );
  }
}
