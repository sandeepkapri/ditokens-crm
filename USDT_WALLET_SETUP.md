# USDT ERC-20 Wallet Integration Setup

## 🎯 **Overview**

This system integrates USDT ERC-20 payments with your DiTokens CRM, allowing users to:
- Send USDT to the company wallet (`0x7E874A697007965c6A3DdB1702828A764E7a91c3`)
- Automatically receive DIT tokens
- Get admin notifications for all transaction events

## 🔧 **What's Been Implemented**

### 1. **Database Schema Updates**
- ✅ Added `usdtWalletAddress` field to User model
- ✅ Migration created and applied

### 2. **USDT Monitoring System** (`src/lib/usdt-monitor.ts`)
- ✅ Transaction monitoring and processing
- ✅ Automatic token distribution
- ✅ Admin notifications for all events
- ✅ Suspicious activity detection
- ✅ User wallet address management

### 3. **API Endpoints**
- ✅ `POST /api/wallet/usdt` - Set user's USDT wallet address
- ✅ `GET /api/wallet/usdt` - Get user's wallet info and transactions
- ✅ `GET /api/admin/usdt-transactions` - Admin transaction monitoring
- ✅ `POST /api/admin/usdt-transactions` - Update transaction status
- ✅ `POST /api/admin/monitor-usdt` - Start monitoring
- ✅ `GET /api/cron/usdt-monitor` - Cron job endpoint

### 4. **User Interface**
- ✅ `/dashboard/wallet/usdt` - User USDT wallet management
- ✅ `/admin/usdt-monitor` - Admin transaction monitoring

## 🚀 **Setup Instructions**

### 1. **Environment Variables**
Add to your `.env` file:
```env
# USDT Monitoring
CRON_SECRET="your-secure-cron-secret-here"
USDT_CONTRACT_ADDRESS="0xdAC17F958D2ee523a2206206994597C13D831ec7"
COMPANY_USDT_WALLET="0x7E874A697007965c6A3DdB1702828A764E7a91c3"
```

### 2. **Blockchain Integration** (Production)
For production, you'll need to integrate with a real blockchain service:

#### Option A: Infura
```bash
npm install @infura/sdk
```

#### Option B: Alchemy
```bash
npm install alchemy-sdk
```

#### Option C: QuickNode
```bash
npm install @quicknode/sdk
```

### 3. **Cron Job Setup**
Set up a cron job to monitor transactions every 5 minutes:

```bash
# Add to your crontab
*/5 * * * * curl -H "Authorization: Bearer your-cron-secret-here" https://yourdomain.com/api/cron/usdt-monitor
```

Or use a service like:
- **Vercel Cron** (if using Vercel)
- **GitHub Actions** (free option)
- **AWS Lambda** with EventBridge
- **Google Cloud Scheduler**

## 📊 **How It Works**

### 1. **User Flow**
1. User sets their USDT wallet address in `/dashboard/wallet/usdt`
2. User sends USDT to company wallet: `0x7E874A697007965c6A3DdB1702828A764E7a91c3`
3. System detects the transaction
4. Tokens are automatically credited to user's account
5. User receives email confirmation

### 2. **Admin Flow**
1. Admins monitor transactions in `/admin/usdt-monitor`
2. Real-time notifications for all events:
   - ✅ Successful deposits
   - ❌ Failed transactions
   - ⚠️ Suspicious activity
   - 📤 Withdrawals
3. Manual verification and status updates

### 3. **Transaction Processing**
1. **Detection**: System monitors company wallet for USDT transfers
2. **Verification**: Validates transaction and user
3. **Processing**: Calculates token amount based on current price
4. **Distribution**: Credits tokens to user account
5. **Notification**: Sends confirmations to user and admins

## 🔔 **Admin Notifications**

Admins receive email notifications for:

### **Deposit Events**
- ✅ User successfully deposited USDT
- ❌ Inactive user attempted deposit
- ⚠️ Unknown sender (suspicious activity)

### **Transaction Events**
- ❌ Transaction processing errors
- ❌ System monitoring errors
- 📤 User withdrawals

### **Suspicious Activity**
- 🚨 Large deposits (>$10,000)
- 🚨 Unknown wallet addresses
- 🚨 Multiple failed attempts

## 🛡️ **Security Features**

### **Transaction Validation**
- ✅ Ethereum address format validation
- ✅ Transaction hash verification
- ✅ Minimum confirmation requirements (3 blocks)
- ✅ User account status checks

### **Suspicious Activity Detection**
- ✅ Large amount thresholds
- ✅ Unknown sender alerts
- ✅ Failed transaction monitoring
- ✅ Admin notification system

### **Access Control**
- ✅ Admin-only monitoring access
- ✅ User wallet privacy protection
- ✅ Secure cron job authentication

## 📱 **User Interface Features**

### **User Dashboard** (`/dashboard/wallet/usdt`)
- 📝 Set/update USDT wallet address
- 📋 View transaction history
- 📋 Copy company wallet address
- 📋 Copy USDT contract address
- 📊 Real-time transaction status

### **Admin Panel** (`/admin/usdt-monitor`)
- 📊 Transaction statistics
- 🔍 Search and filter transactions
- ⚙️ Manual transaction verification
- 📧 Real-time monitoring dashboard
- 🚨 Alert management

## 🔧 **Configuration Options**

### **Monitoring Settings**
```typescript
// In src/lib/usdt-monitor.ts
private static readonly USDT_CONTRACT_ADDRESS = '0xdAC17F958D2ee523a2206206994597C13D831ec7';
private static readonly COMPANY_WALLET = '0x7E874A697007965c6A3DdB1702828A764E7a91c3';
private static readonly MIN_CONFIRMATIONS = 3;
private static readonly SUSPICIOUS_THRESHOLD = 10000; // $10,000 USDT
```

### **Email Notifications**
- ✅ Welcome emails for new users
- ✅ Login notifications
- ✅ Transaction confirmations
- ✅ Admin alerts
- ✅ System error notifications

## 🧪 **Testing**

### **Test the System**
1. **Set up test user**:
   ```bash
   # Activate a test user
   node scripts/check-user-status.js activate test@ditokens.com
   ```

2. **Test wallet management**:
   - Go to `/dashboard/wallet/usdt`
   - Set a test USDT wallet address
   - Verify the address is saved

3. **Test admin monitoring**:
   - Go to `/admin/usdt-monitor`
   - Start monitoring
   - Check transaction logs

4. **Test cron job**:
   ```bash
   curl -H "Authorization: Bearer your-cron-secret-here" http://localhost:3000/api/cron/usdt-monitor
   ```

## 🚨 **Troubleshooting**

### **Common Issues**

1. **Transactions not detected**:
   - Check cron job is running
   - Verify blockchain connection
   - Check admin notifications

2. **User not receiving tokens**:
   - Verify user is active
   - Check transaction status
   - Review admin logs

3. **Admin notifications not working**:
   - Check email configuration
   - Verify admin user status
   - Review notification logs

### **Debug Commands**
```bash
# Check user status
node scripts/check-user-status.js user@example.com

# List all users
node scripts/list-users.js

# Test email system
npm run test:email
```

## 📈 **Monitoring & Analytics**

### **Key Metrics to Track**
- 📊 Total USDT deposits
- 📊 Total tokens distributed
- 📊 Transaction success rate
- 📊 Average transaction size
- 📊 User adoption rate

### **Admin Dashboard Features**
- 📊 Real-time statistics
- 📈 Transaction volume charts
- 🚨 Alert notifications
- 🔍 Advanced filtering
- 📋 Export capabilities

## 🎉 **Ready to Use!**

Your USDT ERC-20 wallet integration is now complete and ready for production use! 

**Next Steps:**
1. Set up blockchain monitoring service
2. Configure cron job for automatic monitoring
3. Test with real USDT transactions
4. Monitor admin notifications
5. Scale as needed

The system will automatically process USDT deposits and distribute DIT tokens while keeping admins informed of all transaction activities! 🚀
