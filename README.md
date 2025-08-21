# Defeat the Dragon 🐉

A pixel-art, ad-free, Pomodoro-style Focus RPG PWA that helps you build focus habits through gamification.

## 🎯 Overview

Defeat the Dragon is a Progressive Web App (PWA) that transforms focus sessions into an epic adventure. Set timers (5-120 minutes), complete sessions to earn XP and Coins, and unlock cosmetics as you progress through your focus journey.

### Key Features

- **Focus Sessions**: 5-120 minute timers with 5-minute steps
- **Soft Shield**: Sessions fail if you leave the app for >15 seconds
- **Economy System**: XP, Coins, and Sparks (for subscribers)
- **Adventure Mode**: Floors, server-timed bosses, and progression
- **Class Ascension**: Unlock classes at Level 5 with unique quests
- **Cosmetics**: Visual-only items (no pay-to-win)
- **PWA**: Installable, offline-capable, push notifications
- **Accessibility**: Dyslexia-friendly fonts, high contrast, TTS support

## 🏗️ Architecture

### Tech Stack

- **Frontend**: Next.js 14+ (App Router), React 18+, TypeScript 5+
- **Styling**: Tailwind CSS, Headless UI
- **Graphics**: PixiJS 7+ for pixel art rendering
- **State Management**: Zustand, TanStack Query
- **Backend**: Supabase (Auth, Postgres, Edge Functions)
- **Payments**: Stripe Checkout + Customer Portal
- **PWA**: Workbox service worker, Web Push (VAPID)
- **Testing**: Vitest, Playwright

### Project Structure

```
defeat-the-dragon/
├── apps/
│   └── web/                 # Next.js PWA application
│       ├── app/            # App Router pages
│       ├── components/     # React components
│       ├── lib/           # Utilities and configurations
│       ├── public/        # Static assets
│       └── supabase/      # Database migrations
├── packages/
│   ├── engine/            # Shared game logic
│   └── ui-tokens/         # Design tokens and constants
└── README.md
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm 9+
- Supabase account
- Stripe account (for payments)

### 1. Clone and Install

```bash
git clone https://github.com/your-username/defeat-the-dragon.git
cd defeat-the-dragon
npm install
```

### 2. Set Up Supabase

1. Create a new Supabase project
2. Run the database migrations:
   ```bash
   npm run db:migrate
   ```
3. Copy your Supabase URL and keys to `apps/web/.env.local`

### 3. Configure Environment Variables

Copy `apps/web/env.example` to `apps/web/.env.local` and fill in your values:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Push Notifications
VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
```

### 4. Set Up Stripe Webhook

1. Create a webhook endpoint in your Stripe dashboard
2. Point it to: `https://your-domain.com/api/stripe/webhook`
3. Add these events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`

### 5. Generate VAPID Keys

```bash
# Install web-push globally
npm install -g web-push

# Generate VAPID keys
web-push generate-vapid-keys
```

### 6. Start Development

```bash
npm run dev
```

Visit `http://localhost:3000` to see your app!

## 📱 PWA Features

### Installation

The app is installable on all platforms:
- **iOS**: Use Safari's "Add to Home Screen"
- **Android**: Chrome will prompt for installation
- **Desktop**: Chrome/Edge will show install button

### Offline Support

- App shell cached for offline access
- Background sync for offline actions
- Graceful degradation when offline

### Push Notifications

- Boss completion alerts
- Daily focus reminders
- Streak maintenance notifications

## 🎮 Game Mechanics

### Focus Sessions

- **Duration**: 5-120 minutes (5-minute increments)
- **Actions**: Train, Study, Learn, Search, Eat, Sleep, Bathe, Maintain, Fight, Adventure
- **Soft Shield**: Session fails if app hidden >15 seconds
- **Rewards**: XP, Coins, (Sparks for subscribers)

### Economy Formulas

```typescript
// XP = minutes × complexity × action_multiplier × streak_bonus
// Coins = XP × 0.6
// Sparks = floor(minutes/25) × (1 + streak_bonus) // Subscribers only
```

### Adventure Mode

- **Floors**: Progress through dungeon levels
- **Mini-Boss**: 1-6 hour server-timed challenges
- **Big Boss**: 8-24 hour epic encounters
- **Class Ascension**: Unlock at Level 5

## 🔒 Security & Privacy

### Row Level Security (RLS)

All database tables have RLS policies ensuring users can only access their own data.

### Data Protection

- No third-party analytics by default
- Opt-in telemetry only
- GDPR-compliant data export/deletion
- JWT-based authentication

### Compliance

- Ad-free (no tracking)
- Cosmetics only (no pay-to-win)
- No user-generated content
- No gambling mechanics

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run e2e

# Type checking
npm run typecheck

# Linting
npm run lint
```

## 🚀 Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main

### Manual Deployment

```bash
# Build the application
npm run build

# Start production server
npm run start
```

### Environment Variables for Production

Ensure all environment variables are set in your production environment:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`

## 📊 Analytics (Optional)

The app includes minimal, privacy-focused analytics:

- Session start/completion
- Shop purchases
- Subscription status changes
- No personal data collection

## 🎨 Customization

### Design Tokens

Modify `packages/ui-tokens/src/` to customize:
- Colors and palettes
- Typography and spacing
- Accessibility features

### Game Balance

Adjust `packages/engine/src/economy.ts` to modify:
- XP/Coin/Sparks formulas
- Level progression
- Loot drop rates

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

### Development Guidelines

- Follow TypeScript strict mode
- Use conventional commits
- Maintain accessibility standards
- Test on multiple devices

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🐛 Support

- **Issues**: [GitHub Issues](https://github.com/your-username/defeat-the-dragon/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-username/defeat-the-dragon/discussions)
- **Email**: support@defeatthedragon.app

## 🗺️ Roadmap

### Phase 1 (Current)
- ✅ Core PWA functionality
- ✅ Focus sessions and Soft Shield
- ✅ Basic economy and rewards
- ✅ Authentication and user profiles

### Phase 2
- 🔄 Adventure mode and boss battles
- 🔄 Class ascension system
- 🔄 Enhanced cosmetics and inventory

### Phase 3
- 📋 Social features (leaderboards)
- 📋 Advanced analytics
- 📋 Mobile app versions

### Phase 4
- 📋 AI-powered dialogue system
- 📋 Advanced accessibility features
- 📋 Internationalization

---

**Made with ❤️ for the focus community**
