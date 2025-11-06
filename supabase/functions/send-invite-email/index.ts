// Edge Function to send team invite emails via Resend
// Deploy with: supabase functions deploy send-invite-email

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

// CORS headers for local testing
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verify Resend API key is configured
    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY environment variable is not set');
    }

    // Parse request body
    const { invitedEmail, organizationName, inviterEmail, role, appUrl } = await req.json();

    // Validate required fields
    if (!invitedEmail || !organizationName || !inviterEmail || !role) {
      return new Response(
        JSON.stringify({
          error: 'Missing required fields',
          required: ['invitedEmail', 'organizationName', 'inviterEmail', 'role']
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Determine app URL (use provided or fallback to localhost for dev)
    const loginUrl = appUrl || 'http://localhost:5173/login';

    // Send email via Resend
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'ArmsterFlow <onboarding@resend.dev>', // Change to your verified domain
        to: [invitedEmail],
        subject: `You've been invited to join ${organizationName} on ArmsterFlow`,
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Team Invitation</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">

  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px;">🎉 You're Invited!</h1>
  </div>

  <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb;">
    <p style="font-size: 16px; margin-bottom: 20px;">
      Hi there,
    </p>

    <p style="font-size: 16px; margin-bottom: 20px;">
      <strong>${inviterEmail}</strong> has invited you to join <strong>${organizationName}</strong> as a <strong style="color: #2563eb;">${role}</strong>.
    </p>

    <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #2563eb; margin: 25px 0;">
      <p style="margin: 0; color: #666; font-size: 14px;">
        <strong>What is ArmsterFlow?</strong><br>
        A collaborative Lean Canvas tool for teams to build and iterate on startup ideas together.
      </p>
    </div>

    <p style="font-size: 16px; margin-bottom: 25px;">
      Click the button below to access your team's projects:
    </p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${loginUrl}"
         style="background: #2563eb;
                color: white;
                padding: 14px 32px;
                text-decoration: none;
                border-radius: 8px;
                display: inline-block;
                font-weight: 600;
                font-size: 16px;
                box-shadow: 0 4px 6px rgba(37, 99, 235, 0.3);">
        Go to ArmsterFlow →
      </a>
    </div>

    <div style="background: #fef3c7; border: 1px solid #fbbf24; padding: 15px; border-radius: 8px; margin-top: 25px;">
      <p style="margin: 0; color: #92400e; font-size: 14px;">
        <strong>⚠️ Important:</strong> If you don't have an ArmsterFlow account yet, you'll need to sign up using this email address (<strong>${invitedEmail}</strong>) first.
      </p>
    </div>

    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

    <p style="font-size: 14px; color: #666; margin-bottom: 10px;">
      <strong>What you can do as a ${role}:</strong>
    </p>

    <ul style="font-size: 14px; color: #666; padding-left: 20px;">
      ${role === 'owner' ? `
        <li>Create and delete projects</li>
        <li>Invite and remove team members</li>
        <li>Edit all project content</li>
        <li>Manage team roles</li>
      ` : role === 'editor' ? `
        <li>Create new projects</li>
        <li>Edit all project content</li>
        <li>View team members</li>
        <li>Collaborate with your team</li>
      ` : `
        <li>View all projects</li>
        <li>See team members</li>
        <li>Export project data</li>
      `}
    </ul>
  </div>

  <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
    <p style="margin: 5px 0;">This invitation was sent by ${inviterEmail}</p>
    <p style="margin: 5px 0;">If you didn't expect this invitation, you can safely ignore this email.</p>
  </div>

</body>
</html>
        `,
      }),
    });

    const data = await res.json();

    // Check if Resend returned an error
    if (!res.ok) {
      console.error('Resend API error:', data);
      throw new Error(data.message || 'Failed to send email');
    }

    console.log('Email sent successfully:', data);

    return new Response(
      JSON.stringify({
        success: true,
        emailId: data.id,
        message: 'Invitation email sent successfully'
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error sending email:', error);

    return new Response(
      JSON.stringify({
        error: error.message || 'Failed to send invitation email',
        details: error.toString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
