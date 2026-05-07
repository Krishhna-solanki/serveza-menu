import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import OTPVerification from "@/components/OTPVerification";
import { useCheckDevice } from "@/hooks/useDeviceFingerprint";
import { OTP_VERIFICATION_ENABLED } from "@/lib/featureFlags";

const Login = () => {
  const navigate = useNavigate();
  const { signIn, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showOTP, setShowOTP] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState<any>(null);

  const { isNewDevice, trustDevice, updateLastUsed } = useCheckDevice(loggedInUser?.id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(email, password);
    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }
    setLoading(false);
    // After successful sign-in, check device
    // The auth state change will provide user data
    // For now navigate directly - device check happens in dashboard
    navigate("/dashboard");
  };

  if (showOTP && loggedInUser) {
    return (
      <OTPVerification
        email={loggedInUser.email}
        userId={loggedInUser.id}
        purpose="device_verification"
        onVerified={async () => {
          await trustDevice();
          navigate("/dashboard");
        }}
        onCancel={() => {
          setShowOTP(false);
          setLoggedInUser(null);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-heading text-gradient-gold mb-2">Serveza Menu</h1>
          <p className="text-muted-foreground">Welcome back</p>
        </div>

        <div className="bg-card border border-border rounded-lg p-6 shadow-lg">
          <h2 className="text-xl font-heading mb-6 text-foreground">Sign In</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="owner@restaurant.com"
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            <Button type="submit" className="w-full gradient-gold text-primary-foreground font-semibold" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
          <p className="text-center text-sm text-muted-foreground mt-4">
            Don't have an account?{" "}
            <Link to="/register" className="text-primary hover:underline">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
