# Pivot Kit

**A comprehensive platform for guiding startups through structured validation** - from problem discovery to pivot decisions, powered by structured frameworks and evidence-based decision making.

## 🚀 Overview

Pivot Kit helps entrepreneurs and startup teams systematically validate their business ideas through:

- **Guided Discovery**: Structured customer interviews and assumption tracking
- **Visual Sector Mapping**: Understand your ecosystem, competitors, and decision makers
- **Pivot or Proceed Framework**: Data-driven decision making for course corrections
- **Enhanced Interview System**: Cognitive debiasing and pattern detection
- **Multi-user Collaboration**: Team-based projects with role management

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite (fast dev server, optimized production builds)
- **Routing**: React Router v7
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL with Row Level Security)
- **Authentication**: Supabase Auth
- **Error Tracking**: Sentry (optional)
- **Testing**: Vitest + React Testing Library
- **UI Components**: Custom components with Tailwind

## ⚡ Quick Start

### Prerequisites

- Node.js 18+ and npm
- Supabase account (free tier works)

### 1. Clone and Install

```bash
git clone https://github.com/Montster27/PivotKit.git
cd PivotKit
npm install
```

### 2. Environment Setup

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Update `.env` with your Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Optional: Sentry error tracking (leave empty to disable)
VITE_SENTRY_DSN=
```

### 3. Database Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Run migrations in order from `supabase/migrations/`:
   - Navigate to SQL Editor in Supabase Dashboard
   - Execute migration files in chronological order
3. Optional: Load seed data for testing (Pet Finder example)

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 📦 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | TypeScript check + production build |
| `npm run preview` | Preview production build locally |
| `npm test` | Run tests in watch mode |
| `npm run test:ui` | Interactive test UI |
| `npm run test:coverage` | Generate coverage report |
| `npm run test:run` | Run tests once (CI mode) |

## 🏗️ Project Structure

```
PivotKit/
├── src/
│   ├── components/          # React components
│   │   ├── discovery/      # Interview & assumption tracking
│   │   ├── visual-sector-map/  # Ecosystem mapping
│   │   └── pivot/          # Pivot or Proceed module
│   ├── contexts/           # React Context providers
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utilities (Supabase, Sentry)
│   ├── pages/              # Route components
│   ├── types/              # TypeScript type definitions
│   └── test/               # Test setup and mocks
├── supabase/
│   └── migrations/         # Database migration scripts
├── vite.config.ts          # Vite configuration
├── vitest.config.ts        # Test configuration
└── tsconfig.json           # TypeScript configuration
```

## 🧪 Testing

We use Vitest + React Testing Library for testing:

```bash
# Run tests in watch mode
npm test

# Run tests once (CI)
npm run test:run

# Interactive UI
npm run test:ui

# Coverage report
npm run test:coverage
```

**Current Coverage**: 30%+ (authentication flows, core hooks)

## 🔒 Security

- **Row Level Security (RLS)**: All database tables protected
- **Organization-based access control**: Users only see their data
- **Supabase Auth**: Secure authentication with email/password
- **Environment variables**: Secrets never committed to repository
- **Input validation**: Client and database-level validation

## 🚢 Production Deployment

### Recommended Platform: Vercel

1. **Connect Repository**
   - Import project from GitHub
   - Vercel auto-detects Vite configuration

2. **Configure Environment Variables**
   - Add `VITE_SUPABASE_URL`
   - Add `VITE_SUPABASE_ANON_KEY`
   - Optional: Add `VITE_SENTRY_DSN` for error tracking

3. **Deploy**
   - Automatic deployments on every push to `main`
   - Preview deployments for pull requests

### Performance

- **Initial page load**: ~22KB gzipped (main bundle)
- **Code splitting**: PDF tools, heavy modules load on-demand
- **Build size**: Optimized with manual chunking
- **Core Web Vitals**: Optimized for fast loading

## 📊 Features

### Discovery Module
- Enhanced interview system with cognitive debiasing
- Assumption tracking and validation
- Pattern detection across interviews
- Synthesis mode for finding insights

### Visual Sector Map
- 5-step wizard for ecosystem mapping
- Actor identification and relationship mapping
- Pain points and opportunity annotations
- Export to image/PDF

### Pivot or Proceed
- Easy and Detailed decision modes
- Pre-mortem analysis and cognitive debiasing
- Quantitative metrics (PMF, retention, unit economics)
- Qualitative insights (Jobs to be Done, customer quotes)
- Confidence assessment and reflection

### Project Management
- Multi-user organizations
- Role-based permissions (Owner, Editor, Viewer)
- Project templates and progress tracking
- Auto-save to Supabase

## 🐛 Error Tracking

Optional Sentry integration for production monitoring:

1. Create Sentry project at [sentry.io](https://sentry.io)
2. Add DSN to `.env`: `VITE_SENTRY_DSN=your-dsn-here`
3. Automatic error tracking with user context
4. Performance monitoring and session replay

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Run tests: `npm test`
4. Commit changes: `git commit -m 'Add amazing feature'`
5. Push to branch: `git push origin feature/amazing-feature`
6. Open a Pull Request

### Code Style

- TypeScript strict mode enabled
- ESLint + Prettier (auto-format on save recommended)
- Follow existing patterns for consistency

## 📝 License

MIT

## 🙏 Acknowledgments

- Built with [Vite](https://vitejs.dev/)
- UI components styled with [Tailwind CSS](https://tailwindcss.com/)
- Database and auth by [Supabase](https://supabase.com/)
- Error tracking by [Sentry](https://sentry.io/)

## 📧 Support

For questions or issues:
- Create an issue on [GitHub](https://github.com/Montster27/PivotKit/issues)
- Contact: support@pivotkit.biz

---

**Production Ready**: ✅ Bundle optimized ✅ Testing infrastructure ✅ Error tracking ✅ Security hardened
