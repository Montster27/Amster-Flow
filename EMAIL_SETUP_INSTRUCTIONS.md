# Email Notifications Setup Guide

## Step 1: Sign Up for Resend

1. Go to [https://resend.com/signup](https://resend.com/signup)
2. Sign up for a free account (3,000 emails/month)
3. Verify your email address

## Step 2: Get Your Resend API Key

1. Log in to Resend dashboard
2. Go to **API Keys** in the left sidebar
3. Click **Create API Key**
4. Name it `ArmsterFlow Production` (or whatever you prefer)
5. Copy the API key (starts with `re_...`)
6. **Save it somewhere safe** - you'll need it in Step 4

## Step 3: Install Supabase CLI

If you don't have it already:

```bash
# macOS
brew install supabase/tap/supabase

# Or using npm
npm install -g supabase
```

Verify installation:
```bash
supabase --version
```

## Step 4: Link Your Supabase Project

```bash
# Navigate to your project directory
cd /Users/montysharma/Documents/ArmsterFlow

# Login to Supabase
supabase login

# Link your project (you'll need your project reference)
supabase link --project-ref YOUR_PROJECT_REF
```

**To find your project reference:**
- Go to your Supabase project dashboard
- Look at the URL: `https://supabase.com/dashboard/project/YOUR_PROJECT_REF`
- Or go to Project Settings > General > Reference ID

## Step 5: Set Environment Variables

Add your Resend API key to Supabase:

```bash
# Set the Resend API key
supabase secrets set RESEND_API_KEY=re_YOUR_API_KEY_HERE
```

Verify it was set:
```bash
supabase secrets list
```

You should see `RESEND_API_KEY` in the list.

## Step 6: Update SQL Function Configuration

Before deploying, you need to update the SQL function with your project details:

1. Open `supabase/update-invite-function-with-email.sql`

2. Find and replace these placeholders:

   **Line 92:** Replace `YOUR_PROJECT_REF`:
   ```sql
   v_function_url := 'https://abcdefg.supabase.co/functions/v1/send-invite-email';
   --                        ^^^^^^^ Replace with your actual project ref
   ```

   **Line 109:** Replace with your production URL:
   ```sql
   'appUrl', 'https://armsterflow.vercel.app/login'  -- Your actual app URL
   ```

3. Save the file

## Step 7: Deploy the Edge Function

```bash
# Deploy the email sending function
supabase functions deploy send-invite-email

# This will:
# - Upload the function code
# - Make it available at: https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-invite-email
```

Expected output:
```
Deploying Function...
Deployed Function send-invite-email: https://your-project.supabase.co/functions/v1/send-invite-email
```

## Step 8: Set Up Service Role Key (For Database)

The database needs your service role key to call the Edge Function.

**Option A: Using Supabase Vault (Recommended)**

1. Go to your Supabase dashboard
2. Database > Extensions
3. Enable `pg_net` extension (if not already enabled)
4. Go to Database > Database Settings
5. Find your **Service Role Key** (the `secret` one, not the `anon` key)
6. Run this SQL in SQL Editor:

```sql
-- Store service role key as a database setting
ALTER DATABASE postgres SET app.supabase_service_role_key = 'your-service-role-key-here';
```

**Option B: Hardcode (Less Secure - Dev Only)**

If you're just testing, you can temporarily hardcode it in the SQL function:

```sql
-- In update-invite-function-with-email.sql, replace line 96:
v_service_role_key := 'your-service-role-key-here';  -- INSECURE - for testing only
```

## Step 9: Run the SQL Update

Run the updated invite function in Supabase SQL Editor:

```sql
-- Copy and paste the entire contents of:
-- supabase/update-invite-function-with-email.sql
```

Expected output:
```
✅ Invite function updated with email notifications!
📧 Emails will be sent via the send-invite-email Edge Function
```

## Step 10: Test the Email Functionality

1. **Test the Edge Function directly** (optional):

```bash
# Test email sending
curl -X POST 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-invite-email' \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "invitedEmail": "test@example.com",
    "organizationName": "Test Org",
    "inviterEmail": "you@example.com",
    "role": "editor",
    "appUrl": "http://localhost:5173/login"
  }'
```

2. **Test via the app:**
   - Log in to your app
   - Go to Organization Settings
   - Invite a real email address (your own test email)
   - Check the inbox for the invitation email

## Step 11: Verify Your Sending Domain (Production)

For production, you should verify your own domain instead of using `onboarding@resend.dev`:

1. **In Resend Dashboard:**
   - Go to **Domains**
   - Click **Add Domain**
   - Enter your domain (e.g., `yourdomain.com`)
   - Add the DNS records shown (MX, TXT, etc.)

2. **Update the Edge Function:**

In `supabase/functions/send-invite-email/index.ts`, change line 59:

```typescript
from: 'ArmsterFlow <noreply@yourdomain.com>',  // Your verified domain
```

3. **Redeploy:**
```bash
supabase functions deploy send-invite-email
```

## Troubleshooting

### Emails Not Sending?

1. **Check Supabase Function Logs:**
   ```bash
   supabase functions logs send-invite-email
   ```

2. **Check Resend Dashboard:**
   - Go to **Emails** tab
   - See if emails appear (sent, failed, etc.)

3. **Common Issues:**
   - ❌ API key not set correctly → Re-run `supabase secrets set`
   - ❌ Service role key not configured → Check Step 8
   - ❌ Function URL wrong → Check `YOUR_PROJECT_REF` in SQL
   - ❌ pg_net extension not enabled → Enable in Supabase dashboard

### Test Service Role Key Configuration:

```sql
-- Run this in SQL Editor to check if it's set:
SELECT current_setting('app.supabase_service_role_key', true);
```

If it returns NULL, the key isn't configured.

### Check Edge Function is Deployed:

```bash
supabase functions list
```

You should see `send-invite-email` in the list.

## Cost Estimate

**Free Tier (Good for MVP):**
- Resend: 3,000 emails/month
- Supabase Edge Functions: 500K requests/month
- **Total: $0/month**

**When to Upgrade:**
- Resend: $20/month for 50,000 emails
- Only needed if you exceed free tier

## Success Checklist

- [ ] Signed up for Resend
- [ ] Got Resend API key
- [ ] Installed Supabase CLI
- [ ] Linked Supabase project
- [ ] Set `RESEND_API_KEY` secret
- [ ] Updated SQL function with project ref and app URL
- [ ] Deployed Edge Function
- [ ] Set service role key in database
- [ ] Ran SQL update
- [ ] Tested email sending
- [ ] (Optional) Verified custom domain

Once all checked, email notifications are live! 🎉

## Next Steps

1. **Monitor email deliverability** in Resend dashboard
2. **Customize email template** in `send-invite-email/index.ts`
3. **Add more email types** (project invites, role changes, etc.)
4. **Set up email analytics** to track open rates

## Support

- **Resend Docs:** https://resend.com/docs
- **Supabase Edge Functions:** https://supabase.com/docs/guides/functions
- **pg_net Extension:** https://supabase.com/docs/guides/database/extensions/pg_net
