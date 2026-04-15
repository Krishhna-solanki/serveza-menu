import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Shield, Mail, RefreshCw } from "lucide-react";

interface OTPVerificationProps {
  email: string;
  userId: string;
  purpose: string;
  onVerified: () => void;
  onCancel?: () => void;
}

const OTPVerification: React.FC<OTPVerificationProps> = ({
  email,
  userId,
  purpose,
  onVerified,
  onCancel,
}) => {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    sendOTP();
  }, []);

  useEffect(() => {
    if (cooldown > 0) {
      const t = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [cooldown]);

  const sendOTP = async () => {
    setSending(true);
    try {
      const { error } = await supabase.functions.invoke("send-otp", {
        body: { email, userId, purpose },
      });
      if (error) throw error;
      toast.success("OTP sent to your email");
      setCooldown(60);
    } catch (err: any) {
      toast.error(err.message || "Failed to send OTP");
    }
    setSending(false);
  };

  const verifyOTP = async () => {
    if (otp.length !== 6) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("verify-otp", {
        body: { email, userId, otp, purpose },
      });
      if (error) throw error;
      if (data?.verified) {
        toast.success("Verification successful!");
        onVerified();
      } else {
        toast.error(data?.message || "Invalid OTP");
        setOtp("");
      }
    } catch (err: any) {
      toast.error(err.message || "Verification failed");
      setOtp("");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-heading text-foreground mb-2">Verify Your Identity</h1>
          <p className="text-muted-foreground text-sm">
            We've sent a 6-digit code to{" "}
            <span className="font-medium text-foreground">{email}</span>
          </p>
        </div>

        <div className="bg-card border border-border rounded-lg p-6 shadow-lg">
          <div className="flex flex-col items-center gap-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="w-4 h-4" />
              <span>Enter the code from your email</span>
            </div>

            <InputOTP maxLength={6} value={otp} onChange={setOtp}>
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>

            <Button
              onClick={verifyOTP}
              className="w-full gradient-gold text-primary-foreground font-semibold"
              disabled={otp.length !== 6 || loading}
            >
              {loading ? "Verifying..." : "Verify Code"}
            </Button>

            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={sendOTP}
                disabled={cooldown > 0 || sending}
                className="text-xs"
              >
                <RefreshCw className={`w-3 h-3 mr-1 ${sending ? "animate-spin" : ""}`} />
                {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend Code"}
              </Button>
              {onCancel && (
                <Button variant="ghost" size="sm" onClick={onCancel} className="text-xs">
                  Cancel
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OTPVerification;
