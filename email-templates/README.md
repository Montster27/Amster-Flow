# Email Templates

This folder contains improved email templates for ArmsterFlow authentication emails.

## Files

- `signup-confirmation.html` - HTML version (rich formatting, recommended)
- `signup-confirmation.txt` - Plain text version (fallback for text-only clients)

## Features

### Visual Improvements
- ✅ Professional gradient header with ArmsterFlow branding
- ✅ Clear, prominent CTA button (blue, rounded)
- ✅ Responsive design (works on mobile and desktop)
- ✅ Modern, clean layout with proper spacing

### Content Improvements
- ✅ Welcoming message for new users
- ✅ "What's Next" section explaining features
- ✅ Demo project notice (mentions "Walking on the Sun")
- ✅ Link expiration notice (24 hours)
- ✅ Pro tip about getting own workspace + demo access

## How to Update in Supabase

### Method 1: Supabase Dashboard (Recommended)

1. **Go to Supabase Dashboard**
   - Navigate to https://supabase.com/dashboard
   - Select your ArmsterFlow project

2. **Open Email Templates**
   - Click **Authentication** in left sidebar
   - Click **Email Templates** tab

3. **Find Confirmation Email**
   - Look for "Confirm signup" template
   - Click to edit

4. **Copy HTML Version**
   ```bash
   cat email-templates/signup-confirmation.html
   ```
   - Copy the entire HTML content
   - Paste into the "Message (HTML)" field

5. **Copy Plain Text Version** (optional but recommended)
   ```bash
   cat email-templates/signup-confirmation.txt
   ```
   - Copy the entire text content
   - Paste into the "Message (Text)" field

6. **Update Subject Line**
   - Change to: `Confirm Your ArmsterFlow Account 🎉`

7. **Save**
   - Click "Save" button at bottom

### Method 2: Supabase CLI

If you have direct access to email configuration:

```bash
# Copy the HTML template
supabase email templates update confirm-signup \
  --subject "Confirm Your ArmsterFlow Account 🎉" \
  --html-file email-templates/signup-confirmation.html \
  --text-file email-templates/signup-confirmation.txt
```

## Testing

After updating:

1. **Create a test account** with a new email
2. **Check your inbox** for the confirmation email
3. **Verify**:
   - HTML renders correctly
   - Button is clickable
   - Link works
   - Mobile view looks good

## Template Variables

These are automatically replaced by Supabase:

| Variable | Description |
|----------|-------------|
| `{{ .ConfirmationURL }}` | Unique confirmation link for the user |
| `{{ .SiteURL }}` | Your site URL (if you need it) |
| `{{ .Token }}` | Confirmation token (if you need it) |
| `{{ .TokenHash }}` | Token hash (if you need it) |

## Customization

To customize further:

1. **Colors**: Update the hex codes in the HTML
   - Primary blue: `#2563eb` → Change to your brand color
   - Gradient: Update `background: linear-gradient(...)` in header

2. **Logo**: Add your logo
   ```html
   <img src="YOUR_LOGO_URL" alt="ArmsterFlow" style="height: 40px;">
   ```

3. **Footer**: Update copyright year or add links
   ```html
   <a href="https://armsterflow.com/terms">Terms</a> |
   <a href="https://armsterflow.com/privacy">Privacy</a>
   ```

## Other Email Templates

You may also want to update these templates in Supabase:

- **Magic Link** - Passwordless login email
- **Reset Password** - Password reset email
- **Email Change** - Email change confirmation
- **Invite** - Team invitation email (if using)

Let me know if you need templates for these as well!
