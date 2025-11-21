# Newsletter System Deployment Guide

## Prerequisites Checklist

Before starting, ensure you have:

- [x] Resend account with API key (starts with `re_...`)
- [ ] Supabase CLI installed and logged in
- [ ] Supabase project linked to your local environment
- [ ] Access to DNS settings for pivotkit.biz
- [ ] Admin access to Supabase dashboard

---

## Part 1: Initial Setup & Verification

### Step 1.1: Verify Supabase CLI Installation

```bash
supabase --version
```

**Expected Output:**
```
supabase version 1.x.x
```

**If not installed:**
```bash
# macOS
brew install supabase/tap/supabase

# Or using npm
npm install -g supabase
```

### Step 1.2: Login to Supabase

```bash
supabase login
```

**What happens:**
- Opens browser for authentication
- Returns: "Logged in. Session valid until..."

**If already logged in:**
- You'll see: "Already logged in"
- That's fine, proceed!

### Step 1.3: Link Your Project

**First, find your project reference ID:**

1. Go to https://supabase.com/dashboard
2. Select your Pivot Kit project
3. Look at the URL: `https://supabase.com/dashboard/project/YOUR_PROJECT_REF`
4. Or go to: **Project Settings** → **General** → **Reference ID**

**Copy the project reference (looks like: `abcdefghijklmnop`)**

```bash
# Navigate to your project
cd /Users/montysharma/Documents/ArmsterFlow

# Link the project (replace with your actual ref)
supabase link --project-ref YOUR_PROJECT_REF
```

**Expected Output:**
```
Linked project YOUR_PROJECT_REF to local config.
```

**Verify it's linked:**
```bash
supabase status
```

You should see your project details.

---

## Part 2: Database Migration

### Step 2.1: Check Current Database State

**Before pushing migrations, check what exists:**

```bash
# List remote migrations
supabase db remote list
```

This shows what migrations are already applied on production.

### Step 2.2: Push Database Migrations

**What this does:**
- Creates `newsletter_subscribers` table
- Sets up Row Level Security (RLS) policies
- Creates indexes for performance
- Adds auto-subscription trigger
- Backfills existing users

**Run the command:**

```bash
supabase db push
```

**Expected Output:**
```
Applying migration 20240522000000_newsletter_subscribers.sql...
Applying migration 20240522000001_auto_subscribe_users.sql...
✔ All migrations applied successfully.
```

**If you see warnings:**
- ⚠️ "Migration already applied" - That's OK, it means it ran before
- ❌ "Permission denied" - Check your project link
- ❌ "Function update_updated_at_column does not exist" - See troubleshooting below

### Step 2.3: Verify Tables Created

**Check in Supabase Dashboard:**

1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to **Database** → **Tables**
4. Look for `newsletter_subscribers` table

**Or check via SQL:**

```bash
# Open SQL editor
# Go to dashboard → SQL Editor → New Query
```

Run this query:
```sql
SELECT * FROM newsletter_subscribers LIMIT 10;
```

**Expected:** You should see existing user emails (from the backfill).

---

## Part 3: Deploy Edge Function

### Step 3.1: Deploy Newsletter Function

**What this does:**
- Uploads the Edge Function code to Supabase
- Makes it available at: `https://YOUR_PROJECT_REF.supabase.co/functions/v1/newsletter`
- Creates three endpoints: `/subscribe`, `/unsubscribe`, `/broadcast`

**Run the command:**

```bash
supabase functions deploy newsletter
```

**Expected Output:**
```
Bundling newsletter...
Deploying newsletter (version 1)...
Deployed newsletter to: https://YOUR_PROJECT_REF.supabase.co/functions/v1/newsletter
```

**Copy the URL** - you'll need it for testing!

### Step 3.2: Verify Function Deployed

```bash
supabase functions list
```

**Expected Output:**
```
NAME          STATUS   VERSION   REGION
newsletter    ACTIVE   1         us-east-1
```

### Step 3.3: Check Function Logs (Initial)

```bash
supabase functions logs newsletter --tail
```

**What this does:**
- Shows real-time logs from the function
- Press Ctrl+C to stop

**Expected:** Empty or minimal output (nothing called yet).

---

## Part 4: Configure Environment Variables

### Step 4.1: Set Resend API Key

**Get your API key from Resend:**
1. Go to https://resend.com/api-keys
2. Copy your API key (starts with `re_...`)

**Set the secret:**

```bash
supabase secrets set RESEND_API_KEY=re_YOUR_ACTUAL_KEY_HERE
```

**Replace `re_YOUR_ACTUAL_KEY_HERE` with your real key!**

**Expected Output:**
```
✔ Secret RESEND_API_KEY set successfully.
```

### Step 4.2: Set Admin Emails

**Who can send broadcasts:**
- support@pivotkit.biz
- monty.sharma@massdigi.org

```bash
supabase secrets set ADMIN_EMAILS="support@pivotkit.biz,monty.sharma@massdigi.org"
```

**Expected Output:**
```
✔ Secret ADMIN_EMAILS set successfully.
```

### Step 4.3: Verify Secrets Set

```bash
supabase secrets list
```

**Expected Output:**
```
NAME                VALUE
RESEND_API_KEY      re_**********************
ADMIN_EMAILS        support@pivotkit.biz,monty.sharma@massdigi.org
SUPABASE_URL        https://YOUR_PROJECT_REF.supabase.co
SUPABASE_SERVICE_ROLE_KEY   eyJ**********************
```

**Important Notes:**
- `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are auto-provided by Supabase
- You should see them in the list automatically
- If missing, contact Supabase support (unusual)

---

## Part 5: Configure Custom Email Domain

### Step 5.1: Add Domain in Resend

1. **Go to:** https://resend.com/domains
2. **Click:** "Add Domain"
3. **Enter:** `pivotkit.biz` (not www, just the root domain)
4. **Click:** "Add Domain"

### Step 5.2: Get DNS Records

**Resend will show you DNS records to add:**

**Example records you'll see:**

| Type | Name | Value | Priority |
|------|------|-------|----------|
| TXT | @ | `v=spf1 include:_spf.resend.com ~all` | - |
| CNAME | resend._domainkey | `YOUR_UNIQUE_KEY.resend.com` | - |
| CNAME | resend2._domainkey | `YOUR_UNIQUE_KEY2.resend.com` | - |
| MX | @ | `feedback-smtp.us-east-1.amazonses.com` | 10 |

**Copy these records!**

### Step 5.3: Add DNS Records to Your Domain

**Where to add DNS records:**
- If you use **Cloudflare**: DNS → Records → Add Record
- If you use **Google Domains**: DNS → Custom records → Manage
- If you use **Namecheap**: Advanced DNS → Add New Record
- If you use **GoDaddy**: DNS → Manage → Add Record

**For each record:**

1. **TXT Record:**
   - Type: TXT
   - Name: @ (or leave blank for root)
   - Value: `v=spf1 include:_spf.resend.com ~all`
   - TTL: 3600 (or auto)

2. **CNAME Record 1 (DKIM):**
   - Type: CNAME
   - Name: `resend._domainkey`
   - Target: `YOUR_UNIQUE_KEY.resend.com` (from Resend)
   - TTL: 3600

3. **CNAME Record 2 (DKIM):**
   - Type: CNAME
   - Name: `resend2._domainkey`
   - Target: `YOUR_UNIQUE_KEY2.resend.com` (from Resend)
   - TTL: 3600

4. **MX Record:**
   - Type: MX
   - Name: @ (or leave blank)
   - Mail server: `feedback-smtp.us-east-1.amazonses.com`
   - Priority: 10
   - TTL: 3600

**Save all records.**

### Step 5.4: Wait for Verification

**How long?**
- Minimum: 5 minutes
- Average: 15-30 minutes
- Maximum: 24 hours (if DNS is slow)

**Check status in Resend:**
1. Go to https://resend.com/domains
2. Look for `pivotkit.biz`
3. Status will show:
   - 🟡 **Pending** - DNS not propagated yet, wait
   - 🟢 **Verified** - Ready to send emails!
   - 🔴 **Failed** - Check DNS records

**Tip:** You can click "Verify DNS Records" button in Resend to manually check.

---

## Part 6: Testing the System

### Test 6.1: Test Subscribe Endpoint

**Using curl:**

```bash
curl -X POST 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/newsletter/subscribe' \
  -H "Content-Type: application/json" \
  -d '{"email":"your-test-email@gmail.com"}'
```

**Replace:**
- `YOUR_PROJECT_REF` with your actual project reference
- `your-test-email@gmail.com` with an email you can access

**Expected Response:**
```json
{"message":"Subscribed successfully"}
```

**Check your email inbox:**
- Subject: "Welcome to the Pivot Kit Newsletter!"
- From: Pivot Kit <noreply@pivotkit.biz>

**If email doesn't arrive:**
- Check spam folder
- Wait 2-3 minutes
- Check function logs: `supabase functions logs newsletter`
- Check Resend dashboard: https://resend.com/emails

### Test 6.2: Test Admin Broadcast (Via UI)

**Important:** You need to be logged in as an admin email!

1. **Deploy frontend first** (if not already):
   ```bash
   git push origin feature/newsletter-system
   # Then deploy via Vercel/your hosting
   ```

2. **Login to your app** using one of these emails:
   - support@pivotkit.biz
   - monty.sharma@massdigi.org

3. **Navigate to:** `/admin/newsletter`

4. **Fill in the form:**
   - Subject: `Test Newsletter`
   - Content: `<h1>Hello!</h1><p>This is a test.</p>`

5. **Click:** "Send Broadcast"

6. **Expected:**
   - Success message: "Sent to X subscribers"
   - Check inbox for test email

### Test 6.3: Check Database Subscribers

**Via Supabase Dashboard:**

1. Go to **Database** → **Tables** → `newsletter_subscribers`
2. You should see:
   - All existing user emails (from backfill)
   - Your test email (from subscribe test)
   - Status: `subscribed`

**Via SQL:**

```sql
SELECT email, status, created_at
FROM newsletter_subscribers
ORDER BY created_at DESC
LIMIT 10;
```

### Test 6.4: Test Unsubscribe

1. **Check the welcome email** you received
2. **Click the unsubscribe link** at the bottom
3. **Expected:** Page says "You have been unsubscribed"

4. **Verify in database:**
   ```sql
   SELECT email, status
   FROM newsletter_subscribers
   WHERE email = 'your-test-email@gmail.com';
   ```

   Status should be: `unsubscribed`

---

## Part 7: Monitor & Verify

### Monitor Function Logs

**Watch real-time logs:**

```bash
supabase functions logs newsletter --tail
```

**Look for:**
- ✅ Successful API calls
- ✅ Email sent confirmations
- ❌ Any errors (troubleshoot below)

### Check Resend Dashboard

1. Go to https://resend.com/emails
2. You should see:
   - Welcome emails sent
   - Broadcast emails sent
   - Delivery status
   - Open rates (if tracking enabled)

### Verify Auto-Subscription Works

**Test that new users are auto-subscribed:**

1. **Create a new user** in your app (sign up with new email)
2. **Check the database:**
   ```sql
   SELECT * FROM newsletter_subscribers
   WHERE email = 'new-user-email@example.com';
   ```
3. **Expected:** New row with status `subscribed`

---

## Part 8: Push to Production

### Step 8.1: Push Branch to Remote

```bash
git push origin feature/newsletter-system
```

### Step 8.2: Merge to Main

**Option A: Via Command Line**

```bash
git checkout main
git merge feature/newsletter-system
git push origin main
```

**Option B: Via GitHub Pull Request**

1. Go to your GitHub repository
2. Click "Pull Requests" → "New Pull Request"
3. Base: `main`, Compare: `feature/newsletter-system`
4. Click "Create Pull Request"
5. Review and merge

### Step 8.3: Deploy Frontend

**If using Vercel:**
- Automatic deployment on push to main
- Check https://vercel.com/dashboard

**If manual deployment:**
```bash
npm run build
# Then upload dist/ folder to your hosting
```

---

## Troubleshooting

### Issue: "Migration already exists"

**Cause:** Migration was run before.

**Solution:**
```bash
# Check remote migrations
supabase db remote list

# If you see 20240522000000 and 20240522000001, they're already applied
# No action needed!
```

### Issue: "Function update_updated_at_column does not exist"

**Cause:** Missing trigger function.

**Solution:** Create it first:

```sql
-- Run this in Supabase SQL Editor
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

Then retry: `supabase db push`

### Issue: "Permission denied for table newsletter_subscribers"

**Cause:** RLS policy blocking access.

**Solution:**
- Edge Function uses Service Role Key, which bypasses RLS
- Make sure `SUPABASE_SERVICE_ROLE_KEY` is set (auto-set by Supabase)
- Check: `supabase secrets list`

### Issue: Emails not sending

**Check 1: Function logs**
```bash
supabase functions logs newsletter
```

Look for Resend API errors.

**Check 2: Resend API key**
```bash
supabase secrets list
```

Verify `RESEND_API_KEY` is set correctly.

**Check 3: Domain verification**
- Go to https://resend.com/domains
- Ensure `pivotkit.biz` is verified
- Check DNS records are correct

**Check 4: Resend dashboard**
- https://resend.com/emails
- Check if emails show as "sent" or "failed"
- Click on failed emails for error details

### Issue: "Not an admin" error when sending broadcast

**Cause:** Your logged-in email doesn't match `ADMIN_EMAILS`.

**Solution 1: Verify secret**
```bash
supabase secrets list
```

Should show: `support@pivotkit.biz,monty.sharma@massdigi.org`

**Solution 2: Check logged-in email**
- Open browser console
- Run: `localStorage.getItem('supabase.auth.token')`
- Decode the JWT to see which email you're logged in as
- Or just log out and log back in with admin email

**Solution 3: Add your email**
```bash
supabase secrets set ADMIN_EMAILS="support@pivotkit.biz,monty.sharma@massdigi.org,your-email@example.com"
```

### Issue: Domain verification stuck on "Pending"

**Check DNS propagation:**
```bash
# Check if DNS records are live
nslookup -type=TXT pivotkit.biz
nslookup -type=MX pivotkit.biz
```

**Or use online tool:**
- Go to https://dnschecker.org
- Enter `pivotkit.biz`
- Check TXT and MX records globally

**Wait longer:**
- DNS can take up to 48 hours (rare)
- Usually 15-30 minutes

---

## Success Checklist

Before considering deployment complete:

- [ ] Database migrations applied successfully
- [ ] Edge Function deployed and active
- [ ] `RESEND_API_KEY` secret set
- [ ] `ADMIN_EMAILS` secret set
- [ ] Domain `pivotkit.biz` verified in Resend
- [ ] Test email received from `noreply@pivotkit.biz`
- [ ] Admin can send broadcast from `/admin/newsletter`
- [ ] New users auto-subscribed on signup
- [ ] Unsubscribe link works
- [ ] Function logs show no errors
- [ ] Code pushed to main branch
- [ ] Frontend deployed

---

## Quick Reference Commands

```bash
# Check project link
supabase status

# Deploy database
supabase db push

# Deploy function
supabase functions deploy newsletter

# Set secrets
supabase secrets set RESEND_API_KEY=re_YOUR_KEY
supabase secrets set ADMIN_EMAILS="support@pivotkit.biz,monty.sharma@massdigi.org"

# Check secrets
supabase secrets list

# View logs
supabase functions logs newsletter --tail

# List functions
supabase functions list

# Check migrations
supabase db remote list
```

---

## Support Resources

- **Supabase Docs:** https://supabase.com/docs
- **Resend Docs:** https://resend.com/docs
- **Edge Functions:** https://supabase.com/docs/guides/functions
- **DNS Help:** https://dnschecker.org

---

**Ready to deploy? Start with Part 1!** 🚀
