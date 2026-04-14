import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const Register = () => {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    restaurantName: "",
    mobile: "",
    email: "",
    password: "",
  });

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-") + "-" + Math.random().toString(36).substring(2, 8);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await signUp(form.email, form.password, {
        restaurant_name: form.restaurantName,
        mobile: form.mobile,
      });

      if (error) {
        toast.error(error.message);
        setLoading(false);
        return;
      }

      // Wait a moment for session to be established after auto-confirm
      await new Promise((r) => setTimeout(r, 500));

      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const trialEnd = new Date();
        trialEnd.setDate(trialEnd.getDate() + 7);
        const { error: restError } = await supabase.from("restaurants").insert({
          name: form.restaurantName,
          slug: generateSlug(form.restaurantName),
          user_id: session.user.id,
          mobile: form.mobile,
          plan_type: "trial",
          plan_status: "trial",
          trial_end_date: trialEnd.toISOString(),
          status: "active",
        });
        if (restError) {
          console.error("Restaurant creation error:", restError);
          toast.error("Account created but restaurant setup failed. Please try from the dashboard.");
        } else {
          toast.success("Account created successfully!");
        }
        navigate("/dashboard");
      } else {
        toast.success("Account created! Please check your email to verify, then sign in.");
        navigate("/login");
      }
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-heading text-gradient-gold mb-2">Serveza Menu</h1>
          <p className="text-muted-foreground">Create your digital menu</p>
        </div>

        <div className="bg-card border border-border rounded-lg p-6 shadow-lg">
          <h2 className="text-xl font-heading mb-6 text-foreground">Create Account</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="restaurantName">Restaurant Name</Label>
              <Input
                id="restaurantName"
                value={form.restaurantName}
                onChange={(e) => setForm({ ...form, restaurantName: e.target.value })}
                placeholder="e.g. The Golden Spoon"
                required
              />
            </div>
            <div>
              <Label htmlFor="mobile">Mobile Number</Label>
              <Input
                id="mobile"
                value={form.mobile}
                onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                placeholder="+91 9876543210"
                required
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="owner@restaurant.com"
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                minLength={6}
                required
              />
            </div>
            <Button type="submit" className="w-full gradient-gold text-primary-foreground font-semibold" disabled={loading}>
              {loading ? "Creating..." : "Create Account"}
            </Button>
          </form>
          <p className="text-center text-sm text-muted-foreground mt-4">
            Already have an account?{" "}
            <Link to="/login" className="text-gold hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
