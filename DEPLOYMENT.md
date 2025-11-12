# ArmsterFlow - Production Deployment Guide

## 🎯 Prerequisites

- [x] Code reviewed and tested
- [x] All TypeScript errors resolved
- [x] Production build passing (`npm run build`)
- [ ] Sentry account created
- [ ] Vercel account with GitHub connected
- [ ] Production Supabase project ready

## 📋 Deployment Checklist

### Step 1: Set Up Sentry Error Tracking (5 minutes)

**Why**: Production error monitoring with user context and stack traces.

1. **Create Sentry Project**
   - Go to [sentry.io](https://sentry.io) and sign up/login
   - Click "Create Project"
   - Platform: **React**
   - Alert frequency: **On every new issue**
   - Project name: `armsterflow-production`
   - Copy the DSN (looks like: `https://abc123@o123.ingest.sentry.io/456`)

2. **Verify Sentry Integration**
   - Integration code already implemented in `src/lib/sentry.ts`
   - All error tracking uses `captureException()` (46 locations)
   - User context automatically attached via `AuthContext`

### Step 2: Deploy Database Migration (10 minutes)

**Why**: Consolidates duplicate interview systems into single source of truth.

1. **Access Supabase Dashboard**
   - Go to [supabase.com/dashboard](https://supabase.com/dashboard)
   - Select your production project
   - Navigate to **SQL Editor**

2. **Run Migration Script**
   - Open file: `supabase/migrations/20251112_migrate_interviews_to_enhanced.sql`
   - Copy entire contents
   - Paste into SQL Editor
   - Click **Run**
   - Verify: Check that interviews migrated successfully

3. **Verify Migration Success**
   ```sql
   -- Should return count of migrated interviews
   SELECT COUNT(*) FROM project_interviews_enhanced;

   -- Old table should be prevented from new inserts (trigger active)
   SELECT COUNT(*) FROM project_interviews;
   ```

### Step 3: Deploy to Vercel (15 minutes)

**Why**: Automatic deployments, edge network, optimized for Vite apps.

1. **Connect Repository**
   - Go to [vercel.com](https://vercel.com)
   - Click **Add New Project**
   - Import from GitHub: `Montster27/ArmsterFlow`
   - Vercel auto-detects Vite configuration

2. **Configure Environment Variables**

   Add these environment variables in Vercel dashboard:

   ```env
   # Required: Supabase Configuration
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here

   # Required: Sentry Error Tracking
   VITE_SENTRY_DSN=https://abc123@o123.ingest.sentry.io/456
   ```

   **Where to find Supabase credentials:**
   - Dashboard → Project Settings → API
   - URL: Copy "Project URL"
   - Anon Key: Copy "anon public" key

3. **Deploy**
   - Click **Deploy**
   - Wait for build to complete (~2 minutes)
   - Vercel provides production URL (e.g., `armsterflow.vercel.app`)

4. **Set Up Custom Domain** (Optional)
   - Vercel Dashboard → Domains
   - Add your custom domain
   - Follow DNS configuration instructions

### Step 4: Verify Production Deployment (5 minutes)

1. **Smoke Test Critical Flows**
   - [ ] Visit production URL
   - [ ] Sign up with test account
   - [ ] Create a project
   - [ ] Navigate through all modules (Problem, Customer, Solution, Discovery, Sector Map, Pivot)
   - [ ] Verify data persists (refresh page, data should remain)
   - [ ] Test export functionality

2. **Check Sentry Integration**
   - Sentry Dashboard → Issues
   - Should show "Waiting for events" or first errors if any
   - Trigger test error: Intentionally break something temporarily
   - Verify error appears in Sentry with stack trace and user context

3. **Monitor Performance**
   - Vercel Analytics → Speed Insights
   - Check Core Web Vitals (should be green)
   - Initial page load: ~22KB gzipped
   - Time to Interactive: < 2 seconds

### Step 5: Enable Automatic Deployments (2 minutes)

1. **Configure Git Integration**
   - Vercel automatically deploys on push to `main`
   - Pull requests get preview deployments
   - No additional configuration needed

2. **Set Up Branch Protection** (Recommended)
   - GitHub → Settings → Branches
   - Add rule for `main`
   - Require status checks to pass (Vercel deploy)

## 🔒 Security Checklist

- [x] RLS (Row Level Security) enabled on all Supabase tables
- [x] API keys in environment variables (never committed)
- [x] Error tracking with user context (no PII in logs)
- [x] Input validation on forms
- [ ] SSL/HTTPS enforced (automatic with Vercel)

## 📊 Performance Metrics

**Target Metrics:**
- First Contentful Paint (FCP): < 1.5s
- Largest Contentful Paint (LCP): < 2.5s
- Time to Interactive (TTI): < 3.0s
- Bundle Size: < 150KB gzipped (main chunk)

**Current Bundle Sizes:**
```
Main bundle:     22KB gzipped
React vendor:    58KB gzipped
Supabase:        64KB gzipped
PDF tools:      174KB gzipped (lazy-loaded)
```

## 🐛 Troubleshooting

### Build Fails on Vercel

**Error**: TypeScript compilation errors
**Solution**: Run `npm run build` locally, fix all errors, commit and push

**Error**: Missing environment variables
**Solution**: Verify all `VITE_*` variables are set in Vercel dashboard

### Sentry Not Receiving Errors

**Error**: No events showing in Sentry
**Solution**:
1. Verify `VITE_SENTRY_DSN` is set correctly
2. Check browser console for Sentry initialization
3. Trigger test error to verify

### Database Migration Issues

**Error**: Duplicate key violations
**Solution**: Migration script handles duplicates automatically. Check console output.

**Error**: Trigger not created
**Solution**: Ensure you have proper permissions on Supabase project

## 🔄 Rollback Plan

If critical issues arise:

1. **Vercel Rollback**
   - Deployments → Previous deployment → Promote to Production
   - Instant rollback to last working version

2. **Database Rollback**
   - Migration is non-destructive (doesn't delete old data)
   - Old table remains intact
   - Remove trigger if needed to re-enable old system

## 📞 Support

**Issues or Questions:**
- GitHub Issues: [github.com/Montster27/ArmsterFlow/issues](https://github.com/Montster27/ArmsterFlow/issues)
- Email: monty.sharma@massdigi.org

## ✅ Post-Deployment

After successful deployment:

1. **Monitor for 24-48 hours**
   - Check Sentry for errors
   - Monitor Vercel analytics
   - Watch for user reports

2. **Share with Beta Users**
   - Provide production URL
   - Request feedback
   - Monitor usage patterns

3. **Plan Next Release**
   - Review Sentry error trends
   - Analyze performance metrics
   - Prioritize bug fixes and features

---

**Deployment Complete!** 🚀

Your ArmsterFlow application is now live and ready for users.
