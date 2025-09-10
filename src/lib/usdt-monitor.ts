import { prisma } from './prisma';
import { sendNotification } from './email-events';

export interface USDTTransaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  blockNumber: string;
  timestamp: number;
  status: 'success' | 'failed' | 'pending';
  gasUsed?: string;
  gasPrice?: string;
}

export interface USDTTransactionEvent {
  type: 'deposit' | 'withdrawal' | 'failed_transaction' | 'suspicious_activity';
  userId?: string;
  userEmail?: string;
  transaction: USDTTransaction;
  amount: number;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export class USDTMonitor {
  private static readonly USDT_CONTRACT_ADDRESS = '0xdAC17F958D2ee523a2206206994597C13D831ec7'; // USDT on Ethereum
  private static readonly COMPANY_WALLET = '0x7E874A697007965c6A3DdB1702828A764E7a91c3';
  private static readonly MIN_CONFIRMATIONS = 3;
  private static readonly SUSPICIOUS_THRESHOLD = 10000; // $10,000 USDT

  /**
   * Monitor USDT transactions for the company wallet
   */
  static async monitorTransactions() {
    try {
      console.log('🔍 Monitoring USDT transactions...');
      
      // In a real implementation, you would:
      // 1. Connect to Ethereum node (Infura, Alchemy, etc.)
      // 2. Listen for USDT transfer events
      // 3. Process incoming transactions
      
      // For now, we'll simulate monitoring
      await this.simulateTransactionMonitoring();
      
    } catch (error) {
      console.error('❌ Error monitoring USDT transactions:', error);
      await this.notifyAdmins({
        type: 'failed_transaction',
        transaction: {
          hash: 'monitor_error',
          from: 'system',
          to: 'system',
          value: '0',
          blockNumber: '0',
          timestamp: Date.now(),
          status: 'failed'
        },
        amount: 0,
        message: `USDT monitoring system error: ${error}`,
        priority: 'high'
      });
    }
  }

  /**
   * Process a USDT transaction
   */
  static async processTransaction(transaction: USDTTransaction) {
    try {
      console.log(`📥 Processing USDT transaction: ${transaction.hash}`);

      // Check if transaction is to our company wallet
      if (transaction.to.toLowerCase() !== this.COMPANY_WALLET.toLowerCase()) {
        return;
      }

      const amount = parseFloat(transaction.value) / 1e6; // USDT has 6 decimals
      const isDeposit = transaction.from !== this.COMPANY_WALLET.toLowerCase();

      if (isDeposit) {
        await this.processDeposit(transaction, amount);
      } else {
        await this.processWithdrawal(transaction, amount);
      }

    } catch (error) {
      console.error('❌ Error processing transaction:', error);
      await this.notifyAdmins({
        type: 'failed_transaction',
        transaction,
        amount: 0,
        message: `Transaction processing error: ${error}`,
        priority: 'high'
      });
    }
  }

  /**
   * Process a USDT deposit
   */
  private static async processDeposit(transaction: USDTTransaction, amount: number) {
    try {
      // Find user by USDT wallet address
      const user = await prisma.user.findFirst({
        where: {
          usdtWalletAddress: {
            equals: transaction.from,
            mode: 'insensitive'
          }
        }
      });

      if (!user) {
        // Unknown sender - notify admins
        await this.notifyAdmins({
          type: 'suspicious_activity',
          transaction,
          amount,
          message: `Unknown USDT deposit of $${amount.toFixed(2)} from ${transaction.from}`,
          priority: amount > this.SUSPICIOUS_THRESHOLD ? 'critical' : 'medium'
        });
        return;
      }

      // Check if user is active
      if (!user.isActive) {
        await this.notifyAdmins({
          type: 'failed_transaction',
          userId: user.id,
          userEmail: user.email,
          transaction,
          amount,
          message: `Inactive user ${user.email} attempted deposit of $${amount.toFixed(2)}`,
          priority: 'medium'
        });
        return;
      }

      // Calculate tokens based on current price
      const currentPrice = await this.getCurrentTokenPrice();
      const tokenAmount = amount / currentPrice;

      // Create transaction record
      await prisma.transaction.create({
        data: {
          userId: user.id,
          type: 'PURCHASE',
          amount: amount,
          tokenAmount: tokenAmount,
          pricePerToken: currentPrice,
          paymentMethod: 'usdt_erc20',
          status: 'COMPLETED',
          description: `USDT deposit via ERC-20`,
          txHash: transaction.hash,
          walletAddress: transaction.from,
        }
      });

      // Update user's token balance
      await prisma.user.update({
        where: { id: user.id },
        data: {
          totalTokens: { increment: tokenAmount },
          availableTokens: { increment: tokenAmount },
        }
      });

      // Notify user of successful deposit
      await sendNotification(user.id, {
        email: user.email,
        name: user.name,
        title: 'USDT Deposit Successful',
        message: `Your deposit of $${amount.toFixed(2)} USDT has been processed. You received ${tokenAmount.toFixed(2)} DIT tokens.`,
        priority: 'medium'
      });

      // Notify admins
      await this.notifyAdmins({
        type: 'deposit',
        userId: user.id,
        userEmail: user.email,
        transaction,
        amount,
        message: `User ${user.email} deposited $${amount.toFixed(2)} USDT`,
        priority: 'low'
      });

      console.log(`✅ Processed deposit for user ${user.email}: $${amount.toFixed(2)} USDT`);

    } catch (error) {
      console.error('❌ Error processing deposit:', error);
      await this.notifyAdmins({
        type: 'failed_transaction',
        transaction,
        amount,
        message: `Deposit processing error: ${error}`,
        priority: 'high'
      });
    }
  }

  /**
   * Process a USDT withdrawal
   */
  private static async processWithdrawal(transaction: USDTTransaction, amount: number) {
    try {
      // Find user by USDT wallet address
      const user = await prisma.user.findFirst({
        where: {
          usdtWalletAddress: {
            equals: transaction.to,
            mode: 'insensitive'
          }
        }
      });

      if (!user) {
        await this.notifyAdmins({
          type: 'suspicious_activity',
          transaction,
          amount,
          message: `Unknown USDT withdrawal of $${amount.toFixed(2)} to ${transaction.to}`,
          priority: 'high'
        });
        return;
      }

      // Notify admins of withdrawal
      await this.notifyAdmins({
        type: 'withdrawal',
        userId: user.id,
        userEmail: user.email,
        transaction,
        amount,
        message: `User ${user.email} withdrew $${amount.toFixed(2)} USDT`,
        priority: 'medium'
      });

      console.log(`✅ Processed withdrawal for user ${user.email}: $${amount.toFixed(2)} USDT`);

    } catch (error) {
      console.error('❌ Error processing withdrawal:', error);
      await this.notifyAdmins({
        type: 'failed_transaction',
        transaction,
        amount,
        message: `Withdrawal processing error: ${error}`,
        priority: 'high'
      });
    }
  }

  /**
   * Notify admins about transaction events
   */
  private static async notifyAdmins(event: USDTTransactionEvent) {
    try {
      // Get all admin users
      const admins = await prisma.user.findMany({
        where: {
          role: {
            in: ['ADMIN', 'SUPERADMIN']
          },
          isActive: true
        },
        select: {
          id: true,
          email: true,
          name: true
        }
      });

      // Send notifications to all admins
      for (const admin of admins) {
        await sendNotification(admin.id, {
          email: admin.email,
          name: admin.name,
          title: `USDT Transaction Alert - ${event.type.toUpperCase()}`,
          message: event.message,
          priority: event.priority,
          additionalInfo: `
Transaction Hash: ${event.transaction.hash}
Amount: $${event.amount.toFixed(2)} USDT
From: ${event.transaction.from}
To: ${event.transaction.to}
Status: ${event.transaction.status}
Block: ${event.transaction.blockNumber}
          `.trim()
        });
      }

      console.log(`📧 Notified ${admins.length} admin(s) about USDT transaction event`);

    } catch (error) {
      console.error('❌ Error notifying admins:', error);
    }
  }

  /**
   * Get current token price
   */
  private static async getCurrentTokenPrice(): Promise<number> {
    try {
      const latestPrice = await prisma.tokenPrice.findFirst({
        orderBy: { date: 'desc' }
      });
      return latestPrice ? Number(latestPrice.price) : 2.80;
    } catch (error) {
      console.error('Error getting current token price:', error);
      return 2.80; // Fallback price
    }
  }

  /**
   * Simulate transaction monitoring (for development)
   */
  private static async simulateTransactionMonitoring() {
    // This would be replaced with actual blockchain monitoring
    console.log('🔄 Simulating USDT transaction monitoring...');
    
    // Simulate a test transaction
    const testTransaction: USDTTransaction = {
      hash: '0x' + Math.random().toString(16).substr(2, 64),
      from: '0x1234567890123456789012345678901234567890',
      to: this.COMPANY_WALLET,
      value: '1000000', // 1 USDT (6 decimals)
      blockNumber: '18500000',
      timestamp: Date.now(),
      status: 'success'
    };

    await this.processTransaction(testTransaction);
  }

  /**
   * Set user's USDT wallet address
   */
  static async setUserUSDTWallet(userId: string, walletAddress: string): Promise<boolean> {
    try {
      // Validate Ethereum address format
      if (!this.isValidEthereumAddress(walletAddress)) {
        throw new Error('Invalid Ethereum address format');
      }

      await prisma.user.update({
        where: { id: userId },
        data: { usdtWalletAddress: walletAddress }
      });

      return true;
    } catch (error) {
      console.error('Error setting USDT wallet address:', error);
      return false;
    }
  }

  /**
   * Validate Ethereum address format
   */
  private static isValidEthereumAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }

  /**
   * Get transaction history for a user
   */
  static async getUserTransactionHistory(userId: string) {
    try {
      const transactions = await prisma.transaction.findMany({
        where: {
          userId,
          paymentMethod: 'usdt_erc20'
        },
        orderBy: { createdAt: 'desc' },
        take: 50
      });

      return transactions;
    } catch (error) {
      console.error('Error getting user transaction history:', error);
      return [];
    }
  }
}
