import { emailService } from './email';
import { prisma } from './prisma';

export interface EmailEventData {
  userId: string;
  eventType: 'signup' | 'login' | 'payment' | 'purchase' | 'stake' | 'password-reset' | 'notification';
  metadata?: Record<string, any>;
}

export class EmailEventManager {
  /**
   * Handle user signup event
   */
  static async handleUserSignup(userId: string, userData: { email: string; name: string }) {
    try {
      const success = await emailService.sendWelcomeEmail(
        userData.email,
        userData.name
      );
      
      if (success) {
        console.log(`Welcome email sent successfully to ${userData.email}`);
      } else {
        console.error(`Failed to send welcome email to ${userData.email}`);
      }
      
      return success;
    } catch (error) {
      console.error('Error sending welcome email:', error);
      return false;
    }
  }

  /**
   * Handle user login event
   */
  static async handleUserLogin(
    userId: string, 
    userData: { email: string; name: string },
    loginData: { ipAddress: string; userAgent: string; timestamp: Date }
  ) {
    try {
      // Get user's login preferences
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { emailNotifications: true }
      });

      // Only send if user has email notifications enabled
      if (user?.emailNotifications?.loginNotifications !== false) {
        const loginTime = loginData.timestamp.toLocaleString();
        const deviceInfo = this.extractDeviceInfo(loginData.userAgent);
        
        const success = await emailService.sendLoginNotification(
          userData.email,
          userData.name,
          loginTime,
          loginData.ipAddress
        );
        
        if (success) {
          console.log(`Login notification sent to ${userData.email}`);
        } else {
          console.error(`Failed to send login notification to ${userData.email}`);
        }
        
        return success;
      }
      
      return true; // User has notifications disabled
    } catch (error) {
      console.error('Error sending login notification:', error);
      return false;
    }
  }

  /**
   * Handle payment confirmation event
   */
  static async handlePaymentConfirmation(
    userId: string,
    paymentData: {
      email: string;
      name: string;
      amount: string;
      transactionId: string;
      paymentMethod: string;
      paymentType: string;
      description: string;
      processingFee: string;
    }
  ) {
    try {
      const success = await emailService.sendPaymentConfirmation(
        paymentData.email,
        paymentData.name,
        paymentData.amount,
        paymentData.transactionId
      );
      
      if (success) {
        console.log(`Payment confirmation sent to ${paymentData.email}`);
      } else {
        console.error(`Failed to send payment confirmation to ${paymentData.email}`);
      }
      
      return success;
    } catch (error) {
      console.error('Error sending payment confirmation:', error);
      return false;
    }
  }

  /**
   * Handle purchase confirmation event
   */
  static async handlePurchaseConfirmation(
    userId: string,
    purchaseData: {
      email: string;
      name: string;
      tokens: string;
      amount: string;
      transactionId: string;
      paymentMethod: string;
      tokenPrice: string;
      processingFee: string;
      currentValue: string;
    }
  ) {
    try {
      const success = await emailService.sendPurchaseConfirmation(
        purchaseData.email,
        purchaseData.name,
        purchaseData.tokens,
        purchaseData.amount
      );
      
      if (success) {
        console.log(`Purchase confirmation sent to ${purchaseData.email}`);
      } else {
        console.error(`Failed to send purchase confirmation to ${purchaseData.email}`);
      }
      
      return success;
    } catch (error) {
      console.error('Error sending purchase confirmation:', error);
      return false;
    }
  }

  /**
   * Handle stake confirmation event
   */
  static async handleStakeConfirmation(
    userId: string,
    stakeData: {
      email: string;
      name: string;
      tokens: string;
      period: string;
      transactionId: string;
      apy: string;
      lockPeriod: string;
      totalValue: string;
      dailyRewards: string;
      monthlyRewards: string;
      totalRewards: string;
      unlockDate: string;
    }
  ) {
    try {
      const success = await emailService.sendStakeConfirmation(
        stakeData.email,
        stakeData.name,
        stakeData.tokens,
        stakeData.period
      );
      
      if (success) {
        console.log(`Stake confirmation sent to ${stakeData.email}`);
      } else {
        console.error(`Failed to send stake confirmation to ${stakeData.email}`);
      }
      
      return success;
    } catch (error) {
      console.error('Error sending stake confirmation:', error);
      return false;
    }
  }

  /**
   * Handle password reset request
   */
  static async handlePasswordReset(
    userId: string,
    resetData: {
      email: string;
      name: string;
      resetToken: string;
      expiryTime: string;
    }
  ) {
    try {
      const resetLink = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${resetData.resetToken}`;
      
      const success = await emailService.sendPasswordReset(
        resetData.email,
        resetData.name,
        resetLink,
        resetData.expiryTime
      );
      
      if (success) {
        console.log(`Password reset email sent to ${resetData.email}`);
      } else {
        console.error(`Failed to send password reset email to ${resetData.email}`);
      }
      
      return success;
    } catch (error) {
      console.error('Error sending password reset email:', error);
      return false;
    }
  }

  /**
   * Handle withdrawal request notification for user
   */
  static async handleWithdrawalRequest(
    userId: string,
    withdrawalData: {
      email: string;
      name: string;
      amount: string;
      network: string;
      walletAddress: string;
      withdrawalId: string;
      lockPeriod: string;
      estimatedUnlockDate: string;
    }
  ) {
    try {
      const success = await emailService.sendWithdrawalRequest(
        withdrawalData.email,
        withdrawalData.name,
        withdrawalData.amount,
        withdrawalData.network,
        withdrawalData.walletAddress,
        withdrawalData.withdrawalId
      );
      
      if (success) {
        console.log(`Withdrawal request notification sent to ${withdrawalData.email}`);
      } else {
        console.error(`Failed to send withdrawal request notification to ${withdrawalData.email}`);
      }
      
      return success;
    } catch (error) {
      console.error('Error sending withdrawal request notification:', error);
      return false;
    }
  }

  /**
   * Handle account activation notification
   */
  static async handleAccountActivated(
    userId: string,
    userData: { email: string; name: string }
  ) {
    try {
      const success = await emailService.sendAccountActivated(
        userData.email,
        userData.name
      );
      
      if (success) {
        console.log(`Account activation email sent to ${userData.email}`);
      } else {
        console.error(`Failed to send account activation email to ${userData.email}`);
      }
      
      return success;
    } catch (error) {
      console.error('Error sending account activation email:', error);
      return false;
    }
  }

  /**
   * Handle purchase pending notification
   */
  static async handlePurchasePending(
    userId: string,
    userData: { email: string; name: string },
    purchaseData: {
      amount: number;
      tokenAmount: number;
      walletAddress: string;
      transactionId: string;
      paymentMethod: string;
    }
  ) {
    try {
      // Send email to user
      const userSuccess = await emailService.sendPurchasePending(
        userData.email,
        userData.name,
        purchaseData.amount,
        purchaseData.tokenAmount,
        purchaseData.walletAddress,
        purchaseData.transactionId,
        purchaseData.paymentMethod
      );
      
      if (userSuccess) {
        console.log(`Purchase pending email sent to ${userData.email}`);
      } else {
        console.error(`Failed to send purchase pending email to ${userData.email}`);
      }

      // Send email to admins
      const adminSuccess = await this.handlePurchasePendingAdmin({
        userId,
        userEmail: userData.email,
        userName: userData.name,
        amount: purchaseData.amount.toString(),
        tokenAmount: purchaseData.tokenAmount.toString(),
        walletAddress: purchaseData.walletAddress,
        transactionId: purchaseData.transactionId,
        paymentMethod: purchaseData.paymentMethod
      });
      
      return userSuccess && adminSuccess;
    } catch (error) {
      console.error('Error sending purchase pending email:', error);
      return false;
    }
  }

  /**
   * Handle purchase pending notification for admin
   */
  static async handlePurchasePendingAdmin(
    purchaseData: {
      userId: string;
      userEmail: string;
      userName: string;
      amount: string;
      tokenAmount: string;
      walletAddress: string;
      transactionId: string;
      paymentMethod: string;
    }
  ) {
    try {
      // Get admin emails from environment
      const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(email => email.trim()) || [];
      
      if (adminEmails.length === 0) {
        console.warn('No admin emails configured for purchase notifications');
        return false;
      }

      const results = await Promise.allSettled(
        adminEmails.map(adminEmail => 
          emailService.sendPurchasePendingAdmin(
            adminEmail,
            purchaseData.userEmail,
            purchaseData.userName,
            purchaseData.amount,
            purchaseData.tokenAmount,
            purchaseData.walletAddress,
            purchaseData.transactionId,
            purchaseData.paymentMethod
          )
        )
      );

      const successful = results.filter(result => result.status === 'fulfilled').length;
      const failed = results.filter(result => result.status === 'rejected').length;

      console.log(`Purchase pending admin emails: ${successful} sent, ${failed} failed`);
      
      return { successful, failed, total: results.length };
    } catch (error) {
      console.error('Error sending bulk purchase pending admin notifications:', error);
      return { successful: 0, failed: 0, total: 0 };
    }
  }

  /**
   * Handle withdrawal request notification for admin
   */
  static async handleWithdrawalRequestAdmin(
    withdrawalData: {
      userId: string;
      userEmail: string;
      userName: string;
      amount: string;
      network: string;
      walletAddress: string;
      withdrawalId: string;
      lockPeriod: string;
      estimatedUnlockDate: string;
      userBalance: string;
    }
  ) {
    try {
      // Get admin emails from environment
      const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(email => email.trim()) || [];
      
      if (adminEmails.length === 0) {
        console.warn('No admin emails configured for withdrawal notifications');
        return false;
      }

      const results = await Promise.allSettled(
        adminEmails.map(adminEmail => 
          emailService.sendWithdrawalRequestAdmin(
            adminEmail,
            withdrawalData.userEmail,
            withdrawalData.userName,
            withdrawalData.amount,
            withdrawalData.network,
            withdrawalData.walletAddress,
            withdrawalData.withdrawalId,
            withdrawalData.userBalance
          )
        )
      );

      const successful = results.filter(result => result.status === 'fulfilled' && result.value).length;
      const failed = results.length - successful;

      console.log(`Admin withdrawal notifications sent: ${successful} successful, ${failed} failed`);
      
      return { successful, failed, total: results.length };
    } catch (error) {
      console.error('Error sending admin withdrawal notifications:', error);
      return { successful: 0, failed: 0, total: 0 };
    }
  }

  /**
   * Handle general notification event
   */
  static async handleNotification(
    userId: string,
    notificationData: {
      email: string;
      name: string;
      title: string;
      message: string;
      priority?: 'high' | 'medium' | 'low';
      additionalInfo?: string;
      actionRequired?: string;
      details?: string;
      ctaText?: string;
      ctaUrl?: string;
      nextSteps?: string[];
      tips?: string[];
      deadline?: string;
      footerMessage?: string;
    }
  ) {
    try {
      const success = await emailService.sendNotification(
        notificationData.email,
        notificationData.name,
        notificationData.title,
        notificationData.message
      );
      
      if (success) {
        console.log(`Notification sent to ${notificationData.email}`);
      } else {
        console.error(`Failed to send notification to ${notificationData.email}`);
      }
      
      return success;
    } catch (error) {
      console.error('Error sending notification:', error);
      return false;
    }
  }

  /**
   * Send bulk notifications to multiple users
   */
  static async sendBulkNotifications(
    userIds: string[],
    notificationData: {
      title: string;
      message: string;
      priority?: 'high' | 'medium' | 'low';
      additionalInfo?: string;
      actionRequired?: string;
      details?: string;
      ctaText?: string;
      ctaUrl?: string;
      nextSteps?: string[];
      tips?: string[];
      deadline?: string;
      footerMessage?: string;
    }
  ) {
    try {
      const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, email: true, name: true, emailNotifications: true }
      });

      const results = await Promise.allSettled(
        users
          .filter(user => user.emailNotifications?.generalNotifications !== false)
          .map(user => 
            this.handleNotification(user.id, {
              ...notificationData,
              email: user.email,
              name: user.name || 'User'
            })
          )
      );

      const successful = results.filter(result => result.status === 'fulfilled' && result.value).length;
      const failed = results.length - successful;

      console.log(`Bulk notification sent: ${successful} successful, ${failed} failed`);
      
      return { successful, failed, total: results.length };
    } catch (error) {
      console.error('Error sending bulk notifications:', error);
      return { successful: 0, failed: 0, total: 0 };
    }
  }

  /**
   * Extract device information from user agent string
   */
  private static extractDeviceInfo(userAgent: string): string {
    if (!userAgent) return 'Unknown Device';
    
    // Simple device detection
    if (userAgent.includes('Mobile')) return 'Mobile Device';
    if (userAgent.includes('Tablet')) return 'Tablet';
    if (userAgent.includes('Windows')) return 'Windows Computer';
    if (userAgent.includes('Mac')) return 'Mac Computer';
    if (userAgent.includes('Linux')) return 'Linux Computer';
    
    return 'Computer';
  }

  /**
   * Test email service connection
   */
  static async testEmailService(): Promise<boolean> {
    try {
      return await emailService.testConnection();
    } catch (error) {
      console.error('Error testing email service:', error);
      return false;
    }
  }
}

// Export convenience functions
export const sendWelcomeEmail = EmailEventManager.handleUserSignup;
export const sendLoginNotification = EmailEventManager.handleUserLogin;
export const sendPaymentConfirmation = EmailEventManager.handlePaymentConfirmation;
export const sendPurchaseConfirmation = EmailEventManager.handlePurchaseConfirmation;
export const sendStakeConfirmation = EmailEventManager.handleStakeConfirmation;
export const sendPasswordReset = EmailEventManager.handlePasswordReset;
export const sendWithdrawalRequest = EmailEventManager.handleWithdrawalRequest;
export const sendWithdrawalRequestAdmin = EmailEventManager.handleWithdrawalRequestAdmin;
export const sendAccountActivated = EmailEventManager.handleAccountActivated;
export const sendPurchasePending = EmailEventManager.handlePurchasePending;
export const sendPurchasePendingAdmin = EmailEventManager.handlePurchasePendingAdmin;
export const sendNotification = EmailEventManager.handleNotification;
export const sendBulkNotifications = EmailEventManager.sendBulkNotifications;
export const testEmailService = EmailEventManager.testEmailService;
