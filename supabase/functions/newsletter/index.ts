import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const url = new URL(req.url);
        const path = url.pathname.split("/").pop(); // 'subscribe', 'unsubscribe', 'broadcast'

        // Create Supabase client with Service Role Key for admin privileges
        const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

        if (path === "subscribe") {
            const { email } = await req.json();

            if (!email) {
                return new Response(JSON.stringify({ error: "Email is required" }), {
                    status: 400,
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                });
            }

            // Check if already subscribed
            const { data: existing } = await supabase
                .from("newsletter_subscribers")
                .select("*")
                .eq("email", email)
                .single();

            if (existing) {
                if (existing.status === "unsubscribed") {
                    // Resubscribe
                    await supabase
                        .from("newsletter_subscribers")
                        .update({ status: "subscribed" })
                        .eq("id", existing.id);
                }
                // If already subscribed, just return success (idempotent)
            } else {
                // Insert new subscriber
                const { error: insertError } = await supabase
                    .from("newsletter_subscribers")
                    .insert([{ email }]);

                if (insertError) throw insertError;
            }

            // Send Welcome Email
            const res = await fetch("https://api.resend.com/emails", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${RESEND_API_KEY}`,
                },
                body: JSON.stringify({
                    from: "Pivot Kit <noreply@pivotkit.biz>",
                    to: [email],
                    subject: "Welcome to the Pivot Kit Newsletter!",
                    html: `
            <h1>Welcome!</h1>
            <p>Thanks for subscribing to our newsletter.</p>
            <p>You'll receive updates about new features and tips for using Pivot Kit.</p>
            <br/>
            <p><a href="${url.origin}/newsletter/unsubscribe?token=${existing?.unsubscribe_token || 'PENDING_FETCH'}">Unsubscribe</a></p>
          `,
                }),
            });

            if (!res.ok) {
                console.error("Resend error:", await res.text());
            }

            return new Response(JSON.stringify({ message: "Subscribed successfully" }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        if (path === "unsubscribe") {
            const token = url.searchParams.get("token");

            if (!token) {
                return new Response("Invalid unsubscribe link", { status: 400 });
            }

            const { error } = await supabase
                .from("newsletter_subscribers")
                .update({ status: "unsubscribed" })
                .eq("unsubscribe_token", token);

            if (error) {
                return new Response("Error unsubscribing", { status: 500 });
            }

            return new Response(
                `<html>
          <head><title>Unsubscribed</title></head>
          <body style="font-family: sans-serif; text-align: center; padding-top: 50px;">
            <h1>You have been unsubscribed.</h1>
            <p>You will no longer receive our newsletter.</p>
          </body>
        </html>`,
                { headers: { ...corsHeaders, "Content-Type": "text/html" } }
            );
        }

        if (path === "test") {
            try {
                const { subject, content } = await req.json();

                // Get user from Auth header
                const authHeader = req.headers.get('Authorization');
                if (!authHeader) {
                    return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
                        status: 401,
                        headers: { ...corsHeaders, "Content-Type": "application/json" }
                    });
                }

                const { data: { user }, error: userError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));

                if (userError) {
                    console.error("Auth error:", userError);
                    return new Response(JSON.stringify({ error: `Auth failed: ${userError.message}` }), {
                        status: 401,
                        headers: { ...corsHeaders, "Content-Type": "application/json" }
                    });
                }

                if (!user || !user.email) {
                    return new Response(JSON.stringify({ error: "No user found" }), {
                        status: 401,
                        headers: { ...corsHeaders, "Content-Type": "application/json" }
                    });
                }

                // Check if user is an admin (via database)
                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('is_admin')
                    .eq('id', user.id)
                    .single();

                if (profileError) {
                    console.error("Profile lookup error:", profileError);
                    return new Response(JSON.stringify({ error: `Profile check failed: ${profileError.message}` }), {
                        status: 500,
                        headers: { ...corsHeaders, "Content-Type": "application/json" }
                    });
                }

                if (!profile?.is_admin) {
                    return new Response(JSON.stringify({ error: `Forbidden: Not an admin (user: ${user.email})` }), {
                        status: 403,
                        headers: { ...corsHeaders, "Content-Type": "application/json" }
                    });
                }

                // Check if RESEND_API_KEY is set
                if (!RESEND_API_KEY) {
                    console.error("RESEND_API_KEY is not set");
                    return new Response(JSON.stringify({ error: "RESEND_API_KEY not configured" }), {
                        status: 500,
                        headers: { ...corsHeaders, "Content-Type": "application/json" },
                    });
                }

                // Send test email to montys@mit.edu
                const testEmail = "montys@mit.edu";
                const emailHtml = `${content}<br/><br/><p><small>This is a test newsletter.</small></p>`;

                console.log("Sending test email to:", testEmail);

                const res = await fetch("https://api.resend.com/emails", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${RESEND_API_KEY}`,
                    },
                    body: JSON.stringify({
                        from: "Pivot Kit <noreply@pivotkit.biz>",
                        to: [testEmail],
                        subject: `[TEST] ${subject}`,
                        html: emailHtml,
                    }),
                });

                const responseText = await res.text();

                if (!res.ok) {
                    console.error("Resend API error:", res.status, responseText);
                    return new Response(JSON.stringify({
                        error: `Resend API failed (${res.status}): ${responseText}`
                    }), {
                        status: 500,
                        headers: { ...corsHeaders, "Content-Type": "application/json" },
                    });
                }

                console.log("Test email sent successfully");

                return new Response(JSON.stringify({ message: `Test email sent to ${testEmail}` }), {
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                });
            } catch (error) {
                console.error("Test endpoint error:", error);
                return new Response(JSON.stringify({
                    error: `Test failed: ${error.message || String(error)}`
                }), {
                    status: 500,
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                });
            }
        }

        if (path === "broadcast") {
            const { subject, content } = await req.json();

            // Get user from Auth header
            const authHeader = req.headers.get('Authorization');
            if (!authHeader) {
                return new Response(JSON.stringify({ error: "Missing Authorization header" }), { status: 401 });
            }

            const { data: { user }, error: userError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));

            if (userError || !user || !user.email) {
                return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
            }

            // Check if user is an admin (via database)
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('is_admin')
                .eq('id', user.id)
                .single();

            if (profileError || !profile?.is_admin) {
                return new Response(JSON.stringify({ error: "Forbidden: Not an admin" }), { status: 403 });
            }

            // Fetch subscribers
            const { data: subscribers } = await supabase
                .from("newsletter_subscribers")
                .select("email, unsubscribe_token")
                .eq("status", "subscribed");

            if (!subscribers || subscribers.length === 0) {
                return new Response(JSON.stringify({ message: "No subscribers found" }), {
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                });
            }

            // Send emails (batching is better, but loop for MVP)
            let sentCount = 0;
            for (const sub of subscribers) {
                const unsubscribeLink = `${url.origin}/newsletter/unsubscribe?token=${sub.unsubscribe_token}`;
                const emailHtml = `${content}<br/><br/><p><small><a href="${unsubscribeLink}">Unsubscribe</a></small></p>`;

                const res = await fetch("https://api.resend.com/emails", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${RESEND_API_KEY}`,
                    },
                    body: JSON.stringify({
                        from: "Pivot Kit <noreply@pivotkit.biz>",
                        to: [sub.email],
                        subject: subject,
                        html: emailHtml,
                    }),
                });

                if (res.ok) sentCount++;
            }

            return new Response(JSON.stringify({ message: `Sent to ${sentCount} subscribers` }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        return new Response("Not Found", { status: 404 });
    } catch (error) {
        return new Response(JSON.stringify({ error: (error as Error).message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
