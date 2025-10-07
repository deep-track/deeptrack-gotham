# Deeptrack Gotham - Deepfakes detection platform  

A secure Next.js application for AI-powered media verification with integrated payment processing and user authentication.

## Features

- 🔐 **Secure Authentication** - Clerk-based user management with OAuth support
- 💳 **Payment Processing** - Paystack integration for secure payments
- 🤖 **AI Verification** - Reality Defender API for media authenticity detection
- 🗄️ **Production Database** - Turso DB (libSQL) for scalable data storage
- 📱 **Modern UI** - Responsive design with Tailwind CSS
- 🔒 **Security First** - Server-side authentication and authorization

## Prerequisites

- Node.js 18+
- npm/yarn/pnpm
- Accounts with the following services:
  - [Turso](https://turso.tech/) - Database
  - [Clerk](https://clerk.com/) - Authentication
  - [Paystack](https://paystack.com/) - Payments
  - [Reality Defender](https://realitydefender.com/) - AI Verification

## Environment Setup

1. **Copy the environment template:**

   ```bash
   cp .env.example .env
   ```

2. **Configure your environment variables in `.env`:**

### Database Configuration (Turso) 

```bash
TURSO_DATABASE_URL=libsql://your-database-name.turso.io
TURSO_AUTH_TOKEN=your_turso_auth_token
```

**Getting Turso credentials:**

- Sign up at [turso.tech](https://turso.tech/)
- Create a new database
- Copy the database URL from your dashboard
- Generate an auth token in Settings → Tokens

### Authentication (Clerk)

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

**Getting Clerk credentials:**

- Sign up at [clerk.com](https://clerk.com/)
- Create a new application
- Copy keys from Dashboard → API Keys

### Payment Processing (Paystack)

```bash
PAYSTACK_SECRET_KEY=sk_test_...
```

**Getting Paystack credentials:**

- Sign up at [paystack.com](https://paystack.com/)
- Navigate to Settings → API Keys & Webhooks
- Copy your test keys (use live keys for production)

### AI Verification (Reality Defender)

```bash
REALITY_DEFENDER_API_KEY=your_api_key
```

**Getting Reality Defender API key:**

- Contact [Reality Defender](https://realitydefender.com/) for API access
- Add your API key to the environment variables

### App Configuration

```bash
NEXT_PUBLIC_APP_ORIGIN=http://localhost:3000
```

## Installation & Setup

1. **Clone the repository:**

   ```bash
   git clone <repository-url>
   cd deeptrack-gotham
   ```

2. **Install dependencies:**

   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Set up environment variables** (see Environment Setup above)

4. **Start the development server:**

   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

5. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Application Flow

1. **Upload Media** - Users upload images/videos for verification
2. **Create Order** - System creates an order with pricing
3. **Authentication** - Users sign in/up via Clerk
4. **Payment** - Secure payment processing via Paystack
5. **AI Verification** - Reality Defender analyzes media authenticity
6. **Results** - Users view detailed verification results

## Project Structure

```
src/
├── app/
│   ├── api/           # API routes
│   ├── checkout/      # Payment flow
│   ├── history/       # User history
│   └── results/       # Verification results
├── components/        # Reusable UI components
├── hooks/            # Custom React hooks
└── lib/              # Utilities and database
```

## Database Schema

The application uses Turso DB with the following tables:

- **uploads** - File metadata and base64 data
- **orders** - Payment and verification orders
- **users** - User information (managed by Clerk)

## Security Features

- Server-side authentication on all sensitive routes
- User ownership validation for orders
- Secure API key management
- Input validation and sanitization
- CORS protection

## Deployment

### Environment Variables for Production

Ensure all environment variables are set with production values:

- Use Turso production database
- Use Clerk production keys
- Use Paystack live keys
- Set correct `NEXT_PUBLIC_APP_ORIGIN`

### Recommended Platforms

- **Vercel** - Seamless Next.js deployment
- **Netlify** - Alternative hosting option
- **Railway** - Full-stack deployment

## Troubleshooting

### Common Issues

1. **Turso DB 401 Error**
   - Verify `TURSO_AUTH_TOKEN` is correct
   - Check database URL format
   - Ensure token has proper permissions

2. **Clerk Authentication Issues**
   - Verify publishable and secret keys
   - Check domain configuration in Clerk dashboard
   - Ensure middleware is properly configured

3. **Payment Processing Errors**
   - Verify Paystack keys are correct
   - Check webhook configuration
   - Ensure test mode vs live mode consistency

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

[Add your license information here]

## Support

For support, please contact [your-email@domain.com] or create an issue in the repository.
