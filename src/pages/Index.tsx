import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, QrCode, Smartphone, Sparkles } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="container flex items-center justify-between py-6 px-4">
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
      <section className="container px-4 py-20 text-center animate-fade-in">
        <div className="max-w-2xl mx-auto">
          <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl text-foreground leading-tight mb-6">
            Your Restaurant Menu,{" "}
            <span className="text-gradient-gold">Reimagined</span>
          </h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-lg mx-auto">
            Create stunning digital menus your customers will love. No app downloads. Just scan and browse.
          </p>
          <Link to="/register">
            <Button size="lg" className="gradient-gold text-primary-foreground font-semibold px-8 shadow-gold">
              Create Your Menu <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="container px-4 py-16">
        <div className="grid sm:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {[
            { icon: QrCode, title: "QR Code Ready", desc: "Generate a QR code for each table. Customers scan and instantly see your menu." },
            { icon: Smartphone, title: "Mobile-First", desc: "Designed for phones first. Beautiful on any device with dark & light modes." },
            { icon: Sparkles, title: "Premium Design", desc: "Stunning card layouts with smooth animations. Your food deserves it." },
          ].map((feature) => (
            <div key={feature.title} className="text-center animate-slide-up">
              <div className="w-12 h-12 rounded-xl gradient-gold flex items-center justify-center mx-auto mb-4">
                <feature.icon className="w-6 h-6 text-primary-foreground" />
              </div>
              <h3 className="font-heading text-lg text-foreground mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.desc}</p>
            </div>
          ))}
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
