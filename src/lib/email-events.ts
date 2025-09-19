import { emailService } from './email';
import { prisma } from './prisma';

export interface EmailEventData {
  userId: string;
  eventType: 'signup' | 'login' | 'payment' | 'purchase' | 'stake' | 'password-reset' | 'notification' | 'usdt-deposit' | 'usdt-withdrawal' | 'dit-conversion' | 'dit-purchase-balance';
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
      // Send login notification (simplified - no preference check for now)
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
        purchaseData.amount,
        purchaseData.transactionId,
        purchaseData.paymentMethod,
        purchaseData.tokenPrice,
        purchaseData.processingFee,
        purchaseData.currentValue
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
      const adminSuccess = await EmailEventManager.handlePurchasePendingAdmin({
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
        select: { id: true, email: true, name: true }
      });

      const results = await Promise.allSettled(
        users
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
   * Handle withdrawal approved notification for user
   */
  static async handleWithdrawalApproved(
    userId: string,
    withdrawalData: {
      email: string;
      name: string;
      amount: string;
      network: string;
      walletAddress: string;
      transactionId: string;
      processingTime: string;
    }
  ) {
    try {
      const success = await emailService.sendWithdrawalApproved(
        withdrawalData.email,
        withdrawalData.name,
        withdrawalData.amount,
        withdrawalData.network,
        withdrawalData.walletAddress,
        withdrawalData.transactionId,
        withdrawalData.processingTime
      );
      
      if (success) {
        console.log(`Withdrawal approved email sent to ${withdrawalData.email}`);
      } else {
        console.error(`Failed to send withdrawal approved email to ${withdrawalData.email}`);
      }
      
      return success;
    } catch (error) {
      console.error('Error sending withdrawal approved email:', error);
      return false;
    }
  }

  /**
   * Handle withdrawal rejected notification for user
   */
  static async handleWithdrawalRejected(
    userId: string,
    withdrawalData: {
      email: string;
      name: string;
      amount: string;
      network: string;
      walletAddress: string;
      transactionId: string;
      reason: string;
      supportContact: string;
    }
  ) {
    try {
      const success = await emailService.sendWithdrawalRejected(
        withdrawalData.email,
        withdrawalData.name,
        withdrawalData.amount,
        withdrawalData.network,
        withdrawalData.walletAddress,
        withdrawalData.transactionId,
        withdrawalData.reason,
        withdrawalData.supportContact
      );
      
      if (success) {
        console.log(`Withdrawal rejected email sent to ${withdrawalData.email}`);
      } else {
        console.error(`Failed to send withdrawal rejected email to ${withdrawalData.email}`);
      }
      
      return success;
    } catch (error) {
      console.error('Error sending withdrawal rejected email:', error);
      return false;
    }
  }

  /**
   * Handle withdrawal processing notification for admin
   */
  static async handleWithdrawalProcessingAdmin(
    adminData: {
      userName: string;
      userEmail: string;
      userId: string;
      amount: string;
      network: string;
      walletAddress: string;
      transactionId: string;
      action: string;
      adminNotes?: string;
    }
  ) {
    try {
      // Get admin emails from environment
      const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(email => email.trim()) || [];
      
      if (adminEmails.length === 0) {
        console.warn('No admin emails configured for withdrawal processing notifications');
        return false;
      }

      const results = await Promise.allSettled(
        adminEmails.map(adminEmail => 
          emailService.sendWithdrawalProcessingAdmin(
            adminEmail,
            adminData.userName,
            adminData.userEmail,
            adminData.amount,
            adminData.network,
            adminData.walletAddress,
            adminData.transactionId,
            adminData.action,
            adminData.adminNotes,
            adminData.userId
          )
        )
      );

      const successful = results.filter(result => result.status === 'fulfilled' && result.value).length;
      const failed = results.length - successful;

      console.log(`Withdrawal processing admin emails: ${successful} sent, ${failed} failed`);
      
      return { successful, failed, total: results.length };
    } catch (error) {
      console.error('Error sending withdrawal processing admin notifications:', error);
      return { successful: 0, failed: 0, total: 0 };
    }
  }

  /**
   * Handle user registration notification for admin
   */
  static async handleUserRegistrationAdmin(
    userData: {
      userName: string;
      userEmail: string;
      contactNumber: string;
      country: string;
      state: string;
      referralCode: string;
      referredBy?: string;
      registrationTime: string;
    }
  ) {
    try {
      // Get admin emails from environment
      const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(email => email.trim()) || [];
      
      if (adminEmails.length === 0) {
        console.warn('No admin emails configured for user registration notifications');
        return false;
      }

      const results = await Promise.allSettled(
        adminEmails.map(adminEmail => 
          emailService.sendUserRegistrationAdmin(
            adminEmail,
            userData.userName,
            userData.userEmail,
            userData.contactNumber,
            userData.country,
            userData.state,
            userData.referralCode,
            userData.referredBy || '',
            userData.registrationTime
          )
        )
      );

      const successful = results.filter(result => result.status === 'fulfilled' && result.value).length;
      const failed = results.length - successful;

      console.log(`User registration admin emails: ${successful} sent, ${failed} failed`);
      
      return { successful, failed, total: results.length };
    } catch (error) {
      console.error('Error sending user registration admin notifications:', error);
      return { successful: 0, failed: 0, total: 0 };
    }
  }

  /**
   * Handle payment confirmation notification for admin
   */
  static async handlePaymentConfirmationAdmin(
    paymentData: {
      userName: string;
      userEmail: string;
      amount: string;
      tokenAmount: string;
      transactionId: string;
      paymentMethod: string;
      adminNotes?: string;
    }
  ) {
    try {
      // Get admin emails from environment
      const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(email => email.trim()) || [];
      
      if (adminEmails.length === 0) {
        console.warn('No admin emails configured for payment confirmation notifications');
        return false;
      }

      const results = await Promise.allSettled(
        adminEmails.map(adminEmail => 
          emailService.sendPaymentConfirmationAdmin(
            adminEmail,
            paymentData.userName,
            paymentData.userEmail,
            paymentData.amount,
            paymentData.tokenAmount,
            paymentData.transactionId,
            paymentData.paymentMethod,
            paymentData.adminNotes
          )
        )
      );

      const successful = results.filter(result => result.status === 'fulfilled' && result.value).length;
      const failed = results.length - successful;

      console.log(`Payment confirmation admin emails: ${successful} sent, ${failed} failed`);
      
      return { successful, failed, total: results.length };
    } catch (error) {
      console.error('Error sending payment confirmation admin notifications:', error);
      return { successful: 0, failed: 0, total: 0 };
    }
  }

  /**
   * Handle payment rejection notification for admin
   */
  static async handlePaymentRejectionAdmin(
    paymentData: {
      userName: string;
      userEmail: string;
      amount: string;
      tokenAmount: string;
      transactionId: string;
      paymentMethod: string;
      adminNotes?: string;
    }
  ) {
    try {
      // Get admin emails from environment
      const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(email => email.trim()) || [];
      
      if (adminEmails.length === 0) {
        console.warn('No admin emails configured for payment rejection notifications');
        return false;
      }

      const results = await Promise.allSettled(
        adminEmails.map(adminEmail => 
          emailService.sendPaymentRejectionAdmin(
            adminEmail,
            paymentData.userName,
            paymentData.userEmail,
            paymentData.amount,
            paymentData.tokenAmount,
            paymentData.transactionId,
            paymentData.paymentMethod,
            paymentData.adminNotes
          )
        )
      );

      const successful = results.filter(result => result.status === 'fulfilled' && result.value).length;
      const failed = results.length - successful;

      console.log(`Payment rejection admin emails: ${successful} sent, ${failed} failed`);
      
      return { successful, failed, total: results.length };
    } catch (error) {
      console.error('Error sending payment rejection admin notifications:', error);
      return { successful: 0, failed: 0, total: 0 };
    }
  }

  /**
   * Handle USDT deposit confirmation
   */
  static async handleUsdtDepositConfirmation(
    userId: string,
    depositData: {
      email: string;
      name: string;
      amount: string;
      transactionId: string;
      network: string;
      fromWallet: string;
      txHash: string;
      depositDate: string;
    }
  ) {
    try {
      const success = await emailService.sendUsdtDepositConfirmation(
        depositData.email,
        depositData.name,
        depositData.amount,
        depositData.transactionId,
        depositData.network,
        depositData.fromWallet,
        depositData.txHash,
        depositData.depositDate
      );
      
      if (success) {
        console.log(`USDT deposit confirmation sent to ${depositData.email}`);
      } else {
        console.error(`Failed to send USDT deposit confirmation to ${depositData.email}`);
      }
      
      return success;
    } catch (error) {
      console.error('Error sending USDT deposit confirmation:', error);
      return false;
    }
  }

  /**
   * Handle USDT withdrawal request
   */
  static async handleUsdtWithdrawalRequest(
    userId: string,
    withdrawalData: {
      email: string;
      name: string;
      amount: string;
      network: string;
      walletAddress: string;
      withdrawalId: string;
      requestDate: string;
      processingFee: string;
      totalAmount: string;
    }
  ) {
    try {
      const success = await emailService.sendUsdtWithdrawalRequest(
        withdrawalData.email,
        withdrawalData.name,
        withdrawalData.amount,
        withdrawalData.network,
        withdrawalData.walletAddress,
        withdrawalData.withdrawalId,
        withdrawalData.requestDate,
        withdrawalData.processingFee,
        withdrawalData.totalAmount
      );
      
      if (success) {
        console.log(`USDT withdrawal request sent to ${withdrawalData.email}`);
      } else {
        console.error(`Failed to send USDT withdrawal request to ${withdrawalData.email}`);
      }
      
      return success;
    } catch (error) {
      console.error('Error sending USDT withdrawal request:', error);
      return false;
    }
  }

  /**
   * Handle USDT withdrawal approved
   */
  static async handleUsdtWithdrawalApproved(
    userId: string,
    withdrawalData: {
      email: string;
      name: string;
      amount: string;
      network: string;
      walletAddress: string;
      transactionId: string;
      approvalDate: string;
      processingFee: string;
      networkFee: string;
      totalAmount: string;
    }
  ) {
    try {
      const success = await emailService.sendUsdtWithdrawalApproved(
        withdrawalData.email,
        withdrawalData.name,
        withdrawalData.amount,
        withdrawalData.network,
        withdrawalData.walletAddress,
        withdrawalData.transactionId,
        withdrawalData.approvalDate,
        withdrawalData.processingFee,
        withdrawalData.networkFee,
        withdrawalData.totalAmount
      );
      
      if (success) {
        console.log(`USDT withdrawal approved sent to ${withdrawalData.email}`);
      } else {
        console.error(`Failed to send USDT withdrawal approved to ${withdrawalData.email}`);
      }
      
      return success;
    } catch (error) {
      console.error('Error sending USDT withdrawal approved:', error);
      return false;
    }
  }

  /**
   * Handle DIT to USDT conversion confirmation
   */
  static async handleDitToUsdtConversion(
    userId: string,
    conversionData: {
      email: string;
      name: string;
      ditAmount: string;
      usdtAmount: string;
      exchangeRate: string;
      conversionFee: string;
      transactionId: string;
      conversionDate: string;
    }
  ) {
    try {
      const success = await emailService.sendDitToUsdtConversion(
        conversionData.email,
        conversionData.name,
        conversionData.ditAmount,
        conversionData.usdtAmount,
        conversionData.exchangeRate,
        conversionData.conversionFee,
        conversionData.transactionId,
        conversionData.conversionDate
      );
      
      if (success) {
        console.log(`DIT to USDT conversion confirmation sent to ${conversionData.email}`);
      } else {
        console.error(`Failed to send DIT to USDT conversion confirmation to ${conversionData.email}`);
      }
      
      return success;
    } catch (error) {
      console.error('Error sending DIT to USDT conversion confirmation:', error);
      return false;
    }
  }

  /**
   * Handle DIT purchase from USDT balance
   */
  static async handleDitPurchaseFromBalance(
    userId: string,
    purchaseData: {
      email: string;
      name: string;
      tokens: string;
      usdtAmount: string;
      tokenPrice: string;
      processingFee: string;
      totalAmount: string;
      transactionId: string;
      purchaseDate: string;
      remainingUsdtBalance: string;
      totalDitTokens: string;
    }
  ) {
    try {
      const success = await emailService.sendDitPurchaseFromBalance(
        purchaseData.email,
        purchaseData.name,
        purchaseData.tokens,
        purchaseData.usdtAmount,
        purchaseData.tokenPrice,
        purchaseData.processingFee,
        purchaseData.totalAmount,
        purchaseData.transactionId,
        purchaseData.purchaseDate,
        purchaseData.remainingUsdtBalance,
        purchaseData.totalDitTokens
      );
      
      if (success) {
        console.log(`DIT purchase from balance confirmation sent to ${purchaseData.email}`);
      } else {
        console.error(`Failed to send DIT purchase from balance confirmation to ${purchaseData.email}`);
      }
      
      return success;
    } catch (error) {
      console.error('Error sending DIT purchase from balance confirmation:', error);
      return false;
    }
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
export const sendWithdrawalApproved = EmailEventManager.handleWithdrawalApproved;
export const sendWithdrawalRejected = EmailEventManager.handleWithdrawalRejected;
export const sendWithdrawalProcessingAdmin = EmailEventManager.handleWithdrawalProcessingAdmin;
export const sendUserRegistrationAdmin = EmailEventManager.handleUserRegistrationAdmin;
export const sendPaymentConfirmationAdmin = EmailEventManager.handlePaymentConfirmationAdmin;
export const sendPaymentRejectionAdmin = EmailEventManager.handlePaymentRejectionAdmin;
export const sendAccountActivated = EmailEventManager.handleAccountActivated;
export const sendPurchasePending = EmailEventManager.handlePurchasePending;
export const sendPurchasePendingAdmin = EmailEventManager.handlePurchasePendingAdmin;
export const sendNotification = EmailEventManager.handleNotification;
export const sendBulkNotifications = EmailEventManager.sendBulkNotifications;
export const testEmailService = EmailEventManager.testEmailService;

// New USDT and DIT convenience functions
export const sendUsdtDepositConfirmation = EmailEventManager.handleUsdtDepositConfirmation;
export const sendUsdtWithdrawalRequest = EmailEventManager.handleUsdtWithdrawalRequest;
export const sendUsdtWithdrawalApproved = EmailEventManager.handleUsdtWithdrawalApproved;
export const sendDitToUsdtConversion = EmailEventManager.handleDitToUsdtConversion;
export const sendDitPurchaseFromBalance = EmailEventManager.handleDitPurchaseFromBalance;
