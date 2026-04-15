import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { email, userId, otp, purpose } = await req.json();

    if (!email || !userId || !otp || !purpose) {
      return new Response(JSON.stringify({ verified: false, message: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Find valid OTP
    const { data: otpRecord, error } = await supabase
      .from("otp_verifications")
      .select("*")
      .eq("user_id", userId)
      .eq("email", email)
      .eq("otp_code", otp)
      .eq("purpose", purpose)
      .eq("is_used", false)
      .gte("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error || !otpRecord) {
      return new Response(
        JSON.stringify({ verified: false, message: "Invalid or expired OTP" }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Mark OTP as used
    await supabase
      .from("otp_verifications")
      .update({ is_used: true })
      .eq("id", otpRecord.id);

    // If purpose is device verification, mark device as trusted
    if (purpose === "device_verification") {
      // Device fingerprint would be passed in a real implementation
    }

    return new Response(
      JSON.stringify({ verified: true, message: "OTP verified successfully" }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error verifying OTP:", error);
    return new Response(
      JSON.stringify({ verified: false, message: "Verification failed" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
