# Troubleshooting Email Delivery Issues

If the application says emails are sent successfully but they are not arriving, the issue is likely with the **Supabase Email Configuration** or **Rate Limits**.

## 1. Check Supabase Rate Limits (Most Likely)
By default, Supabase's built-in email service has strict rate limits to prevent spam.
- **Limit**: ~3 emails per hour per project.
- **Symptom**: The first few emails arrive, then they stop arriving, but the API might still report success (or the error isn't visible).

**Solution**:
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard).
2. Navigate to **Authentication** > **Rate Limits**.
3. Check if you have hit the "Email Rate Limit".
4. **Fix**: Use a custom SMTP server (see below) to bypass these limits.

## 2. Check Spam/Junk Folder
Emails sent via the default `noreply@mail.app.supabase.io` often land in Spam/Junk folders because they are sent from a shared domain.
- **Action**: Check your Spam folder.
- **Fix**: Configure a custom SMTP server to send emails from your own domain.

## 3. Configure Custom SMTP (Recommended for Production)
For reliable delivery, you **must** configure a custom SMTP provider (like Resend, SendGrid, AWS SES, or even Gmail).

1. Go to **Project Settings** > **Authentication** > **SMTP Settings**.
2. Toggle **Enable Custom SMTP**.
3. Enter your SMTP provider details.
   - **Sender Email**: `noreply@yourdomain.com`
   - **Sender Name**: ArmsterFlow
4. Save and test.

## 4. Check Site URL and Redirects
Ensure your URLs are whitelisted in Supabase.
1. Go to **Authentication** > **URL Configuration**.
2. **Site URL**: Should be your main production URL (e.g., `https://armsterflow.vercel.app`).
3. **Redirect URLs**: Must include:
   - `http://localhost:5173/**` (for local dev)
   - `https://armsterflow.vercel.app/**` (for production)
   - Specifically: `.../reset-password` and `.../dashboard`

## 5. Verify Email Provider is Enabled
1. Go to **Authentication** > **Providers**.
2. Ensure **Email** is expanded and "Enable Email Provider" is toggled **ON**.
3. Ensure "Confirm email" is toggled **ON** (if you require email confirmation).

## 6. Check Supabase Logs
1. Go to **Logs** > **Auth Logs** in the Supabase dashboard.
2. Look for `500` errors or specific failure messages related to email sending.
