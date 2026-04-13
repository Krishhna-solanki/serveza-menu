import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, QrCode, Smartphone, Sparkles, BarChart3, Shield, Check, Crown, Zap, Star } from "lucide-react";

const plans = [
  { name: "Free Trial", price: "₹0", period: "7 days", desc: "Try everything free" },
  { name: "Monthly", price: "₹499", period: "/month", desc: "Full access" },
  { name: "Yearly", price: "₹4,999", period: "/year", desc: "Save ₹989", popular: true },
  { name: "5 Year", price: "₹14,999", period: "/5 years", desc: "Save ₹10,000+" },
  { name: "Lifetime", price: "₹12,000", period: "one-time", desc: "+ ₹999/yr maintenance" },
];

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="container flex items-center justify-between py-5 px-4">
        <h1 className="font-heading text-2xl text-gradient-gold">Serveza Menu</h1>
        <div className="flex gap-3">
          <Link to="/login">
            <Button variant="ghost" size="sm">Sign In</Button>
          </Link>
          <Link to="/register">
            <Button size="sm" className="gradient-gold text-primary-foreground font-semibold">Get Started</Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="container px-4 py-16 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="animate-fade-in">
            <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl text-foreground leading-tight mb-6">
              Your Restaurant Menu,{" "}
              <span className="text-gradient-gold">Reimagined</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-lg">
              Create stunning digital menus your customers will love. No app downloads. Just scan and browse.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/register">
                <Button size="lg" className="gradient-gold text-primary-foreground font-semibold px-8 shadow-gold">
                  Create Your Menu <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate("/menu/demo")}
              >
                View Demo Menu
              </Button>
            </div>
          </div>

          {/* Phone mockup */}
          <div className="hidden lg:flex justify-center animate-slide-up">
            <div className="relative">
              <div className="w-64 h-[500px] rounded-[2.5rem] border-4 border-border bg-card shadow-2xl overflow-hidden">
                <div className="h-8 bg-card flex items-center justify-center">
                  <div className="w-20 h-4 rounded-full bg-muted" />
                </div>
                <div className="p-4 space-y-3">
                  <div className="h-24 rounded-xl gradient-gold opacity-30" />
                  <div className="flex gap-2">
                    {["Starters", "Mains", "Drinks"].map((t) => (
                      <span key={t} className="px-3 py-1 rounded-full bg-muted text-xs text-muted-foreground">{t}</span>
                    ))}
                  </div>
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex gap-3 bg-muted/50 rounded-lg p-2">
                      <div className="w-14 h-14 rounded-lg bg-muted flex-shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3 w-3/4 bg-muted rounded" />
                        <div className="h-2 w-1/2 bg-muted rounded" />
                        <div className="h-3 w-1/4 rounded bg-primary/20" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {/* QR floating badge */}
              <div className="absolute -bottom-4 -right-4 w-20 h-20 rounded-2xl gradient-gold shadow-gold flex items-center justify-center animate-scale-in">
                <QrCode className="w-10 h-10 text-primary-foreground" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container px-4 py-16 border-t border-border">
        <h2 className="font-heading text-2xl sm:text-3xl text-center text-foreground mb-12">
          Everything you need to go <span className="text-gradient-gold">digital</span>
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {[
            { icon: QrCode, title: "QR Code Ready", desc: "Generate a QR code for each table. Customers scan and instantly see your menu." },
            { icon: Smartphone, title: "Mobile-First", desc: "Designed for phones first. Beautiful on any device with dark & light modes." },
            { icon: Sparkles, title: "Premium Design", desc: "Stunning layouts with smooth animations. Your food deserves the best." },
            { icon: BarChart3, title: "Admin Dashboard", desc: "Manage categories, items, images and pricing all from one clean panel." },
            { icon: Shield, title: "Secure & Fast", desc: "Built on modern cloud infrastructure. Your data is always safe and menu loads instantly." },
            { icon: Crown, title: "Flexible Plans", desc: "Start free for 7 days. Upgrade to monthly, yearly, or lifetime plans." },
          ].map((feature, i) => (
            <div
              key={feature.title}
              className="bg-card border border-border rounded-xl p-6 hover:border-primary/30 transition-colors animate-fade-in"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="w-10 h-10 rounded-lg gradient-gold flex items-center justify-center mb-4">
                <feature.icon className="w-5 h-5 text-primary-foreground" />
              </div>
              <h3 className="font-heading text-base text-foreground mb-1">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="container px-4 py-16 border-t border-border">
        <div className="text-center mb-10">
          <h2 className="font-heading text-2xl sm:text-3xl text-foreground mb-3">
            Simple, transparent <span className="text-gradient-gold">pricing</span>
          </h2>
          <p className="text-muted-foreground">Start with a free trial. Upgrade when you're ready.</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 max-w-4xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`bg-card border rounded-xl p-4 text-center ${
                plan.popular ? "border-primary ring-2 ring-primary/20" : "border-border"
              }`}
            >
              {plan.popular && (
                <span className="text-[10px] font-semibold text-gold uppercase tracking-wider">Popular</span>
              )}
              <p className="font-heading text-xl text-foreground">{plan.price}</p>
              <p className="text-xs text-muted-foreground">{plan.period}</p>
              <p className="text-xs text-muted-foreground mt-1">{plan.desc}</p>
            </div>
          ))}
        </div>
        <div className="text-center mt-8">
          <Link to="/pricing">
            <Button className="gradient-gold text-primary-foreground font-semibold">
              View All Plans <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 text-center">
        <p className="text-sm text-muted-foreground">
          © 2026 <span className="text-gold">Serveza Menu</span>. All rights reserved.
        </p>
      </footer>
    </div>
  );
};

export default Index;
