# Quick Start: Email Notifications (5 Minutes)

## TL;DR

```bash
# 1. Get Resend API key from https://resend.com
# 2. Set it in Supabase
supabase secrets set RESEND_API_KEY=re_YOUR_KEY

# 3. Deploy function
supabase functions deploy send-invite-email

# 4. Update and run SQL
# - Edit supabase/update-invite-function-with-email.sql
# - Replace YOUR_PROJECT_REF with your actual project ref
# - Run in Supabase SQL Editor

# 5. Test it!
```

## Find Your Project Ref

Go to: `https://supabase.com/dashboard/project/YOUR_PROJECT_REF`

The PROJECT_REF is in your URL (looks like: `abcdefghijklmnop`)

## Get Your Service Role Key

1. Supabase Dashboard → Project Settings → API
2. Copy the **service_role** key (the `secret` one)
3. Run in SQL Editor:

```sql
ALTER DATABASE postgres SET app.supabase_service_role_key = 'eyJhb...your-key';
```

## Quick Test

```bash
# Test the function
curl -X POST 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-invite-email' \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "invitedEmail": "your-email@example.com",
    "organizationName": "Test Org",
    "inviterEmail": "sender@example.com",
    "role": "editor",
    "appUrl": "http://localhost:5173/login"
  }'
```

Expected response:
```json
{
  "success": true,
  "emailId": "abc123...",
  "message": "Invitation email sent successfully"
}
```

## That's It!

Now when you invite team members through the app, they'll receive beautiful HTML emails.

**Full instructions:** See `EMAIL_SETUP_INSTRUCTIONS.md`
