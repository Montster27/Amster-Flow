# Email Notifications for Team Invites

## Current Status
Currently, when users are invited to an organization, they receive NO notification. They must:
1. Log in to ArmsterFlow
2. Discover they've been added to an organization
3. See new projects appear in their dashboard

## Recommended Production Solution

### Option 1: Supabase Edge Function with Resend (Recommended)

**Why Resend?**
- Simple API
- Free tier: 3,000 emails/month
- Great deliverability
- Easy integration with Supabase

**Implementation Steps:**

1. **Sign up for Resend** (https://resend.com/)
   - Get API key
   - Verify your sending domain (or use resend.dev for testing)

2. **Create Edge Function**
   ```bash
   # In your project directory
   supabase functions new send-invite-email
   ```

3. **Add Resend API Key to Supabase**
   - Go to Project Settings > Edge Functions
   - Add secret: `RESEND_API_KEY=your_key_here`

4. **Edge Function Code** (`supabase/functions/send-invite-email/index.ts`):
   ```typescript
   import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
   import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

   const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

   serve(async (req) => {
     try {
       const { invitedEmail, organizationName, inviterName, role } = await req.json()

       const res = await fetch('https://api.resend.com/emails', {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json',
           'Authorization': `Bearer ${RESEND_API_KEY}`,
         },
         body: JSON.stringify({
           from: 'ArmsterFlow <noreply@yourdomain.com>',
           to: [invitedEmail],
           subject: `You've been invited to join ${organizationName} on ArmsterFlow`,
           html: `
             <h2>You've been invited!</h2>
             <p>${inviterName} has invited you to join <strong>${organizationName}</strong> as a ${role}.</p>
             <p>Log in to ArmsterFlow to access your team's Lean Canvas projects:</p>
             <a href="https://your-app.vercel.app/login"
                style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; margin: 16px 0;">
               Go to ArmsterFlow
             </a>
             <p style="color: #666; font-size: 14px; margin-top: 24px;">
               If you don't have an account, you'll need to sign up with this email address first.
             </p>
           `,
         }),
       })

       const data = await res.json()

       return new Response(JSON.stringify(data), {
         headers: { 'Content-Type': 'application/json' },
         status: 200,
       })
     } catch (error) {
       return new Response(JSON.stringify({ error: error.message }), {
         headers: { 'Content-Type': 'application/json' },
         status: 400,
       })
     }
   })
   ```

5. **Update invite_user_to_organization function** to call Edge Function:
   ```sql
   -- Add to the end of the function, before RETURN
   PERFORM
     net.http_post(
       url := 'https://your-project-ref.supabase.co/functions/v1/send-invite-email',
       headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.settings.service_role_key') || '"}',
       body := json_build_object(
         'invitedEmail', p_user_email,
         'organizationName', (SELECT name FROM organizations WHERE id = p_organization_id),
         'inviterName', (SELECT email FROM profiles WHERE id = auth.uid()),
         'role', p_role
       )::text
     );
   ```

6. **Deploy Edge Function**:
   ```bash
   supabase functions deploy send-invite-email
   ```

### Option 2: SendGrid Integration

Similar to Resend but with SendGrid's API. Free tier: 100 emails/day.

### Option 3: Database Trigger + External Service

Create a database trigger that inserts into a notifications table, then have a separate process (cron job, worker) that sends emails in batches.

## Simpler Alternative (For Now)

### In-App Notifications Only

Instead of email, add a "Notifications" bell icon in the header that shows:
- "You've been added to [Organization Name]"
- "New project created in [Organization]"

Store in a `notifications` table and mark as read when clicked.

**Pros:**
- No email infrastructure needed
- Immediate implementation
- No external dependencies

**Cons:**
- Users must be logged in to see notifications
- Less discoverable than email

## Implementation Cost Comparison

| Solution | Setup Time | Monthly Cost | Deliverability | Complexity |
|----------|------------|--------------|----------------|------------|
| Resend   | 2-3 hours  | Free (3k)    | Excellent      | Low        |
| SendGrid | 2-3 hours  | Free (100/day)| Good          | Low        |
| In-App Only | 1 hour  | Free         | N/A            | Very Low   |

## Recommendation

For production: **Use Resend with Edge Functions**
- Best balance of simplicity, cost, and deliverability
- Easy to set up
- Scales well

For MVP/testing: **In-app notifications**
- Get to market faster
- Add email later when needed
- Still provides user awareness

## Next Steps

1. Decide on notification strategy (email vs in-app vs both)
2. If email: Sign up for Resend and get API key
3. Implement chosen solution
4. Test with real email addresses
5. Monitor deliverability and open rates
