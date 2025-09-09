# Ditokens CRM

A comprehensive CRM application built with Next.js 15+ for managing token sales, user relationships, and referral systems.

## Features

### 🔐 Authentication System
- User registration with comprehensive profile fields
- Secure login/logout with session handling
- Role-based access control (User, Admin, Superadmin)

### 🪙 Token Management
- 50M token sale with dynamic pricing
- Starting price: $2.80 USD
- Daily price updates with interactive charts
- 3-year minimum staking period
- Wallet integration for deposits and withdrawals

### 👥 Referral System
- Unique referral codes for each user
- 5% referral commission (one-time)
- Monthly payout in USD equivalent
- Referral tracking and analytics

### 💬 Communication Tools
- Internal messaging system
- **Automated email system** with multiple provider support (Zoho, Gmail, SendGrid, custom SMTP)
- **Event-driven emails** for signup, login, payments, purchases, staking, and password resets
- **Customizable email templates** with responsive design
- Live chat integration
- Client communication management

### 🛠️ Admin Panel
- Superadmin dashboard
- User management
- Transaction monitoring
- Token price management
- Referral system oversight
- Content management

## Tech Stack

- **Frontend**: Next.js 15+ with App Router
- **Backend**: Next.js API Routes
- **Database**: MySQL with Prisma ORM
- **Authentication**: NextAuth.js
- **Styling**: TailwindCSS
- **Charts**: Recharts
- **Language**: TypeScript

## Prerequisites

- Node.js 18+ 
- MySQL database
- npm or pnpm package manager

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ditokens-crm
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Update `.env` with your database credentials and email configuration:
   ```env
   DATABASE_URL="mysql://username:password@localhost:3306/ditokens_crm"
   NEXTAUTH_SECRET="your-secret-key-here"
   NEXTAUTH_URL="http://localhost:3000"
   JWT_SECRET="your-jwt-secret-here"
   
   # Email Configuration (see env.example for all options)
   EMAIL_PROVIDER="zoho"
   ZOHO_EMAIL="your-email@zoho.com"
   ZOHO_PASSWORD="your-zoho-app-password"
   ```

4. **Set up the database**
   ```bash
   # Generate Prisma client
   npx prisma generate
   
   # Run database migrations
   npx prisma migrate dev --name init
   
   # Seed the database (optional)
   npx prisma db seed
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Database Schema

The application uses the following main models:

- **User**: User profiles, authentication, and token balances
- **TokenPrice**: Daily token price tracking
- **StakingRecord**: Token staking information
- **Transaction**: All financial transactions
- **ReferralCommission**: Referral earnings tracking
- **Message**: Internal communication system
- **LiveChat**: Live chat messages
- **SystemSettings**: Application configuration

## API Endpoints

### Authentication
- `POST /api/auth/sign-up` - User registration
- `POST /api/auth/sign-in` - User login
- `GET/POST /api/auth/[...nextauth]` - NextAuth endpoints

### User Management
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/users/referrals` - Get user referrals

### Token Operations
- `GET /api/tokens/price` - Get current token price
- `POST /api/tokens/stake` - Stake tokens
- `POST /api/tokens/unstake` - Unstake tokens
- `GET /api/tokens/balance` - Get token balance

### Admin
- `GET /api/admin/users` - List all users
- `PUT /api/admin/users/:id` - Update user
- `POST /api/admin/tokens/price` - Update token price

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Main dashboard
│   └── layout.tsx         # Root layout
├── components/            # Reusable components
├── lib/                   # Utility libraries
│   ├── auth.ts           # NextAuth configuration
│   ├── prisma.ts         # Prisma client
│   ├── email.ts          # Email service configuration
│   └── email-events.ts   # Email event handlers
├── templates/             # Email templates
│   └── emails/           # Handlebars email templates
├── types/                 # TypeScript type definitions
└── utils/                 # Helper functions
```

## Development

### Running in Development Mode
```bash
npm run dev
```

### Building for Production
```bash
npm run build
npm start
```

### Database Management
```bash
# View database in Prisma Studio
npx prisma studio

# Reset database
npx prisma migrate reset

# Generate new migration
npx prisma migrate dev --name <migration-name>
```

## Security Features

- Password hashing with bcrypt
- JWT-based authentication
- Role-based access control
- Input validation with Zod
- SQL injection prevention with Prisma

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Email System

The application includes a comprehensive email system that automatically sends emails for various user events:

### Supported Email Providers
- **Zoho** (recommended for business use)
- **Gmail** (with app password)
- **SendGrid** (for high-volume sending)
- **Custom SMTP** (any email provider)
- **Local Sendmail** (for VPS deployments)

### Automatic Email Events
- Welcome emails on user signup
- Login notifications with security details
- Payment confirmations with receipts
- Purchase confirmations for token buys
- Stake confirmations with reward details
- Password reset requests
- Custom notifications and announcements

### Email Templates
All emails use responsive HTML templates with Handlebars for dynamic content. Templates are fully customizable and located in `src/templates/emails/`.

For detailed email system documentation, see [EMAIL_SYSTEM_README.md](./EMAIL_SYSTEM_README.md).

## Support

For support and questions, please contact the development team or create an issue in the repository.
