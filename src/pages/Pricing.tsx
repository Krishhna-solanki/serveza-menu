import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useRestaurant } from "@/hooks/useRestaurant";
import { usePaymentRequests, useCreatePaymentRequest } from "@/hooks/usePayments";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { uploadFile } from "@/lib/storage";
import { Check, Crown, Zap, Star, Shield, Upload, ArrowLeft } from "lucide-react";

const plans = [
  {
    id: "monthly",
    name: "Monthly",
    price: 499,
    period: "/month",
    icon: Zap,
    features: ["Full menu management", "QR code generation", "Unlimited menu items", "Priority support"],
    popular: false,
  },
  {
    id: "yearly",
    name: "Yearly",
    price: 4999,
    period: "/year",
    savings: "Save ₹989",
    icon: Star,
    features: ["Everything in Monthly", "2 months free", "Analytics dashboard", "Custom branding"],
    popular: true,
  },
  {
    id: "five_year",
    name: "5 Year Plan",
    price: 14999,
    period: "/5 years",
    savings: "Save ₹10,000+",
    icon: Crown,
    features: ["Everything in Yearly", "Locked-in pricing", "Premium support", "Early access to features"],
    popular: false,
  },
  {
    id: "lifetime",
    name: "Lifetime",
    price: 12000,
    period: "one-time",
    extra: "+ ₹999/year maintenance",
    icon: Shield,
    features: ["Everything in 5 Year", "Lifetime access", "No recurring fees", "VIP support"],
    popular: false,
  },
];

const Pricing = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: restaurant } = useRestaurant();
  const { data: paymentRequests } = usePaymentRequests(restaurant?.id);
  const createPayment = useCreatePaymentRequest();

  const [selectedPlan, setSelectedPlan] = useState<typeof plans[0] | null>(null);
  const [paymentDialog, setPaymentDialog] = useState(false);
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [upiTxnId, setUpiTxnId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const hasPendingRequest = paymentRequests?.some((r: any) => r.status === "pending");

  const handleSelectPlan = (plan: typeof plans[0]) => {
    if (!user) {
      navigate("/login");
      return;
    }
    setSelectedPlan(plan);
    setPaymentDialog(true);
  };

  const handleSubmitPayment = async () => {
    if (!screenshot || !selectedPlan || !restaurant || !user) return;
    setSubmitting(true);
    try {
      const screenshotUrl = await uploadFile(screenshot, `${restaurant.id}/payments`);
      if (!screenshotUrl) {
        toast.error("Failed to upload screenshot");
        setSubmitting(false);
        return;
      }
      await createPayment.mutateAsync({
        restaurant_id: restaurant.id,
        user_id: user.id,
        plan_type: selectedPlan.id,
        amount: selectedPlan.price,
        screenshot_url: screenshotUrl,
        upi_transaction_id: upiTxnId || undefined,
      });
      toast.success("Payment request submitted! We'll review and activate your plan shortly.");
      setPaymentDialog(false);
      setScreenshot(null);
      setUpiTxnId("");
      setSelectedPlan(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to submit payment");
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="container flex items-center justify-between h-16 px-4">
          <h1 className="font-heading text-xl text-gradient-gold">Serveza Menu</h1>
          {user && (
            <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Dashboard
            </Button>
          )}
        </div>
      </header>

      <div className="container max-w-6xl py-12 px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-heading text-foreground mb-3">Choose Your Plan</h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Upgrade your restaurant's digital menu experience. Start with a 7-day free trial.
          </p>
          {hasPendingRequest && (
            <Badge className="mt-4 bg-yellow-500/10 text-yellow-600 border-yellow-500/20" variant="outline">
              You have a pending payment request under review
            </Badge>
          )}
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => {
            const Icon = plan.icon;
            return (
              <div
                key={plan.id}
                className={`relative bg-card border rounded-xl p-6 flex flex-col ${
                  plan.popular ? "border-primary shadow-lg ring-2 ring-primary/20" : "border-border"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="gradient-gold text-primary-foreground">Most Popular</Badge>
                  </div>
                )}
                <div className="mb-4">
                  <Icon className="w-8 h-8 text-primary mb-3" />
                  <h3 className="font-heading text-lg text-foreground">{plan.name}</h3>
                  {plan.savings && (
                    <Badge variant="outline" className="mt-1 text-xs bg-green-500/10 text-green-600 border-green-500/20">
                      {plan.savings}
                    </Badge>
                  )}
                </div>
                <div className="mb-6">
                  <span className="text-3xl font-heading text-foreground">₹{plan.price.toLocaleString()}</span>
                  <span className="text-muted-foreground text-sm ml-1">{plan.period}</span>
                  {plan.extra && <p className="text-xs text-muted-foreground mt-1">{plan.extra}</p>}
                </div>
                <ul className="space-y-2 mb-6 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  className={plan.popular ? "gradient-gold text-primary-foreground w-full" : "w-full"}
                  variant={plan.popular ? "default" : "outline"}
                  onClick={() => handleSelectPlan(plan)}
                  disabled={hasPendingRequest}
                >
                  {hasPendingRequest ? "Request Pending" : "Get Started"}
                </Button>
              </div>
            );
          })}
        </div>

        {/* Free Trial Info */}
        <div className="mt-12 text-center bg-card border border-border rounded-xl p-8">
          <h3 className="font-heading text-xl text-foreground mb-2">🎉 7-Day Free Trial</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Every new restaurant gets a 7-day free trial with full access to all features. No payment required to start.
          </p>
          {!user && (
            <Button className="mt-4 gradient-gold text-primary-foreground" onClick={() => navigate("/register")}>
              Start Free Trial
            </Button>
          )}
        </div>
      </div>

      {/* Payment Dialog */}
      <Dialog open={paymentDialog} onOpenChange={setPaymentDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">Complete Payment</DialogTitle>
          </DialogHeader>
          {selectedPlan && (
            <div className="space-y-6">
              <div className="bg-muted rounded-lg p-4">
                <p className="text-sm text-muted-foreground">Selected Plan</p>
                <p className="font-heading text-lg text-foreground">{selectedPlan.name}</p>
                <p className="text-2xl font-heading text-foreground mt-1">
                  ₹{selectedPlan.price.toLocaleString()}
                  <span className="text-sm text-muted-foreground ml-1">{selectedPlan.period}</span>
                </p>
              </div>

              <div className="bg-muted rounded-lg p-4 space-y-3">
                <p className="font-medium text-foreground text-sm">Pay via UPI</p>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">UPI ID:</span>
                  <code className="bg-background px-2 py-1 rounded text-sm text-foreground">serveza@phonepe</code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText("serveza@phonepe");
                      toast.success("UPI ID copied!");
                    }}
                  >
                    Copy
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Pay ₹{selectedPlan.price.toLocaleString()} to the above UPI ID using PhonePe, Google Pay, or any UPI app.
                </p>
              </div>

              <div>
                <Label>Payment Screenshot *</Label>
                <div className="mt-1 border-2 border-dashed border-border rounded-lg p-4 text-center">
                  {screenshot ? (
                    <div className="space-y-2">
                      <p className="text-sm text-foreground">{screenshot.name}</p>
                      <Button variant="outline" size="sm" onClick={() => setScreenshot(null)}>
                        Change
                      </Button>
                    </div>
                  ) : (
                    <label className="cursor-pointer">
                      <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Click to upload screenshot</p>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => setScreenshot(e.target.files?.[0] || null)}
                      />
                    </label>
                  )}
                </div>
              </div>

              <div>
                <Label>UPI Transaction ID (optional)</Label>
                <Input
                  value={upiTxnId}
                  onChange={(e) => setUpiTxnId(e.target.value)}
                  placeholder="e.g. T2306151234567890"
                  className="mt-1"
                />
              </div>

              <Button
                className="w-full gradient-gold text-primary-foreground"
                onClick={handleSubmitPayment}
                disabled={!screenshot || submitting}
              >
                {submitting ? "Submitting..." : "Submit Payment Request"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Pricing;
