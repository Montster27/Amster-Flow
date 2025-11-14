# Security Setup Guide for AmsterFlow

This document outlines the security configuration steps required for production deployment.

## Table of Contents
- [Supabase Authentication Settings](#supabase-authentication-settings)
- [Security Headers](#security-headers)
- [Password Requirements](#password-requirements)
- [Environment Variables](#environment-variables)

---

## Supabase Authentication Settings

### Email Confirmation (REQUIRED)

**⚠️ CRITICAL: Must be configured in Supabase Dashboard**

1. Go to Supabase Dashboard → Authentication → Settings
2. Under "Email Auth" section:
   - **Enable "Confirm email"** - Users must verify email before accessing the platform
   - Set **"Confirmation expiry"** to 24 hours (default)
   - **Enable "Secure email change"** - Requires confirmation for email changes

### Password Policy (REQUIRED)

**Configured in Supabase Dashboard → Authentication → Policies**

Minimum requirements:
- **Minimum length:** 8 characters (enforced in UI and recommended for Supabase)
- Complexity requirements (optional but recommended):
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one number
  - Special characters optional but encouraged

> **Note:** As of writing, Supabase does not provide granular password complexity rules in the dashboard. The 8-character minimum is enforced client-side. Consider using Supabase Auth Hooks for advanced validation.

### Session Management

**Default Supabase settings are secure:**
- JWT expiry: 3600 seconds (1 hour)
- Refresh token expiry: 604800 seconds (7 days)
- Auto-refresh enabled in client configuration

**No changes needed unless specific requirements exist.**

### Rate Limiting

**Supabase provides basic rate limiting:**
- Default: 30 requests per minute per IP for auth endpoints
- For additional protection, consider Vercel middleware (see below)

---

## Security Headers

Security headers are configured in `/vercel.json` and automatically applied by Vercel on deployment.

### Current Configuration

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Permissions-Policy",
          "value": "camera=(), microphone=(), geolocation=(), interest-cohort=()"
        },
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=63072000; includeSubDomains; preload"
        },
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live https://*.sentry.io; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://*.supabase.co https://*.supabase.in https://*.sentry.io wss://*.supabase.co; frame-ancestors 'none'; base-uri 'self'; form-action 'self';"
        }
      ]
    }
  ]
}
```

### Verification

After deployment, verify headers at:
- https://securityheaders.com
- https://observatory.mozilla.org

**Expected grade:** A or A+

---

## Password Requirements

### Client-Side Validation

Implemented in `/src/pages/SignUpPage.tsx`:
- Minimum 8 characters
- HTML5 validation with `minLength={8}`
- User-friendly error messages

### Future Enhancements

Consider implementing:
1. **Password strength indicator** - Visual feedback during password entry
2. **Common password blacklist** - Prevent "password123", "12345678", etc.
3. **Password history** - Prevent reuse of last N passwords (requires backend)
4. **Password expiration** - Force password reset after 90/180 days (optional)

---

## Environment Variables

### Required Variables

All secrets must be stored in Vercel Environment Variables (not in code or `.env` files):

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Optional: Error Tracking
VITE_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
```

### Security Best Practices

1. **Never commit secrets to Git**
   - `.env` is in `.gitignore`
   - Use `.env.example` as template only

2. **Use Vercel's encrypted environment variables**
   - Automatically encrypted at rest
   - Separate values for Preview/Production

3. **Rotate keys every 90 days** (recommended)
   - Supabase: Generate new anon key
   - Sentry: Rotate DSN if compromised

4. **Service Role Key**
   - Never expose `SUPABASE_SERVICE_ROLE_KEY` to frontend
   - Only use in secure backend/serverless functions
   - Not currently used in AmsterFlow (auth uses RLS instead)

---

## Checklist for Production Deployment

### Pre-Deployment

- [ ] Enable email confirmation in Supabase Dashboard
- [ ] Configure password policy (8+ characters minimum)
- [ ] Set session timeouts (use defaults unless specific requirements)
- [ ] Configure environment variables in Vercel
- [ ] Review RLS policies (all 211 policies should be enabled)
- [ ] Test signup flow with email verification
- [ ] Test login flow with incorrect credentials
- [ ] Verify security headers on staging deployment

### Post-Deployment

- [ ] Run security headers check (securityheaders.com)
- [ ] Test email confirmation flow end-to-end
- [ ] Verify Sentry is receiving errors
- [ ] Check Supabase logs for any RLS violations
- [ ] Monitor failed login attempts
- [ ] Document any deviations from this guide

---

## Additional Security Measures (Optional)

### Two-Factor Authentication (2FA)

Supabase supports 2FA via TOTP. Consider enabling for:
- Super admins (is_admin = true)
- Program administrators (organization owners)

**Implementation:** Requires Supabase Auth UI or custom implementation

### Rate Limiting (Advanced)

For additional protection beyond Supabase defaults:

1. **Vercel Middleware** - Rate limit by IP
2. **Upstash Redis** - Distributed rate limiting
3. **Supabase Edge Functions** - Custom rate limiting logic

### Audit Logging

**Coming in Sprint 2:**
- Track all authentication events
- Log role changes and member additions
- Monitor data access patterns

---

## Support

For questions about security configuration:
- Email: montys@mit.edu
- Docs: `/docs/ERROR_TRACKING_OPTIONS.md`
- Supabase Docs: https://supabase.com/docs/guides/auth

---

**Last Updated:** 2025-01-14
**Version:** 1.0
**Maintained By:** AmsterFlow Security Team
