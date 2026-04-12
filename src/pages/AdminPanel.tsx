import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useIsAdmin, useAllRestaurants, useUpdateRestaurantStatus, useUpdateRestaurantPlan } from "@/hooks/useAdmin";
import { useAllPaymentRequests, useApprovePayment, useRejectPayment } from "@/hooks/usePayments";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { LogOut, Copy, Users, CheckCircle, Clock, CreditCard, ImageIcon, X, Check } from "lucide-react";

const AdminPanel = () => {
  const navigate = useNavigate();
  const { user, signOut, loading: authLoading } = useAuth();
  const { isAdmin, isLoading: roleLoading } = useIsAdmin();
  const { data: restaurants, isLoading } = useAllRestaurants();
  const { data: paymentRequests } = useAllPaymentRequests();
  const updateStatus = useUpdateRestaurantStatus();
  const updatePlan = useUpdateRestaurantPlan();
  const approvePayment = useApprovePayment();
  const rejectPayment = useRejectPayment();

  const [activeTab, setActiveTab] = useState<"restaurants" | "payments">("restaurants");
  const [screenshotDialog, setScreenshotDialog] = useState<string | null>(null);

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-primary animate-pulse font-heading text-2xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    navigate("/login");
    return null;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="font-heading text-2xl text-foreground mb-2">Access Denied</h1>
          <p className="text-muted-foreground">You don't have permission to access this page.</p>
          <Button className="mt-4" onClick={() => navigate("/dashboard")}>Go to Dashboard</Button>
        </div>
      </div>
    );
  }

  const totalRestaurants = restaurants?.length || 0;
  const activeCount = restaurants?.filter((r) => r.status === "active").length || 0;
  const pendingCount = restaurants?.filter((r) => r.status === "pending").length || 0;
  const paidCount = restaurants?.filter((r) => r.plan === "paid").length || 0;
  const pendingPayments = paymentRequests?.filter((p: any) => p.status === "pending").length || 0;

  const statusColor = (status: string) => {
    switch (status) {
      case "active": case "approved": return "bg-green-500/10 text-green-600 border-green-500/20";
      case "pending": return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
      case "blocked": case "rejected": return "bg-red-500/10 text-red-600 border-red-500/20";
      default: return "";
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await updateStatus.mutateAsync({ id, status });
      toast.success(`Status updated to ${status}`);
    } catch (err: any) { toast.error(err.message); }
  };

  const handlePlanChange = async (id: string, plan: string) => {
    try {
      await updatePlan.mutateAsync({ id, plan });
      toast.success(`Plan updated to ${plan}`);
    } catch (err: any) { toast.error(err.message); }
  };

  const handleApprove = async (payment: any) => {
    try {
      await approvePayment.mutateAsync({
        paymentId: payment.id,
        restaurantId: payment.restaurant_id,
        planType: payment.plan_type,
      });
      toast.success("Payment approved and plan activated!");
    } catch (err: any) { toast.error(err.message); }
  };

  const handleReject = async (paymentId: string) => {
    try {
      await rejectPayment.mutateAsync({ paymentId, notes: "Payment rejected by admin" });
      toast.success("Payment rejected");
    } catch (err: any) { toast.error(err.message); }
  };

  const planLabel = (type: string) => {
    switch (type) {
      case "monthly": return "Monthly ₹499";
      case "yearly": return "Yearly ₹4,999";
      case "five_year": return "5 Year ₹14,999";
      case "lifetime": return "Lifetime ₹12,000";
      default: return type;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="container flex items-center justify-between h-16 px-4">
          <h1 className="font-heading text-xl text-gradient-gold">Super Admin Panel</h1>
          <Button variant="ghost" size="sm" onClick={async () => { await signOut(); navigate("/login"); }}>
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </header>

      <div className="container max-w-6xl py-6 px-4">
        {/* Analytics */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {[
            { icon: Users, label: "Total Restaurants", value: totalRestaurants, color: "text-foreground" },
            { icon: CheckCircle, label: "Active", value: activeCount, color: "text-green-500" },
            { icon: Clock, label: "Pending", value: pendingCount, color: "text-yellow-500" },
            { icon: CreditCard, label: "Paid", value: paidCount, color: "text-primary" },
            { icon: ImageIcon, label: "Payment Requests", value: pendingPayments, color: "text-orange-500" },
          ].map((stat) => (
            <div key={stat.label} className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <stat.icon className="w-4 h-4" />
                <span className="text-xs">{stat.label}</span>
              </div>
              <p className={`text-2xl font-heading ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-muted rounded-lg p-1">
          {[
            { id: "restaurants" as const, label: "Restaurants" },
            { id: "payments" as const, label: `Payment Requests ${pendingPayments > 0 ? `(${pendingPayments})` : ""}` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                activeTab === tab.id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Restaurants Tab */}
        {activeTab === "restaurants" && (
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="p-4 border-b border-border">
              <h2 className="font-heading text-lg text-foreground">All Restaurants</h2>
            </div>
            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground">Loading...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-4 text-muted-foreground font-medium">Name</th>
                      <th className="text-left p-4 text-muted-foreground font-medium">Mobile</th>
                      <th className="text-left p-4 text-muted-foreground font-medium">Status</th>
                      <th className="text-left p-4 text-muted-foreground font-medium">Plan</th>
                      <th className="text-left p-4 text-muted-foreground font-medium">Link</th>
                      <th className="text-left p-4 text-muted-foreground font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {restaurants?.map((r) => (
                      <tr key={r.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                        <td className="p-4">
                          <p className="font-medium text-foreground">{r.name}</p>
                          <p className="text-xs text-muted-foreground">{r.slug}</p>
                        </td>
                        <td className="p-4 text-muted-foreground">{r.mobile || "—"}</td>
                        <td className="p-4">
                          <Badge variant="outline" className={statusColor(r.status)}>{r.status}</Badge>
                        </td>
                        <td className="p-4">
                          <Badge variant="outline">{r.plan}</Badge>
                        </td>
                        <td className="p-4">
                          <Button variant="ghost" size="sm" onClick={() => {
                            navigator.clipboard.writeText(`${window.location.origin}/menu/${r.slug}`);
                            toast.success("Copied!");
                          }}>
                            <Copy className="w-3 h-3 mr-1" /> Copy
                          </Button>
                        </td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            <Select value={r.status} onValueChange={(v) => handleStatusChange(r.id, v)}>
                              <SelectTrigger className="w-[100px] h-8 text-xs"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="blocked">Blocked</SelectItem>
                              </SelectContent>
                            </Select>
                            <Select value={r.plan} onValueChange={(v) => handlePlanChange(r.id, v)}>
                              <SelectTrigger className="w-[80px] h-8 text-xs"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="free">Free</SelectItem>
                                <SelectItem value="paid">Paid</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Payment Requests Tab */}
        {activeTab === "payments" && (
          <div className="space-y-4">
            {!paymentRequests?.length && (
              <div className="bg-card border border-border rounded-lg p-8 text-center text-muted-foreground">
                No payment requests yet.
              </div>
            )}
            {paymentRequests?.map((p: any) => (
              <div key={p.id} className="bg-card border border-border rounded-lg p-4">
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-foreground">{p.restaurants?.name || "Unknown"}</p>
                      <Badge variant="outline" className={statusColor(p.status)}>{p.status}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">Plan: {planLabel(p.plan_type)}</p>
                    <p className="text-sm text-muted-foreground">Amount: ₹{p.amount?.toLocaleString()}</p>
                    {p.upi_transaction_id && (
                      <p className="text-sm text-muted-foreground">UPI Txn: {p.upi_transaction_id}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(p.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setScreenshotDialog(p.screenshot_url)}
                    >
                      <ImageIcon className="w-4 h-4 mr-1" /> Screenshot
                    </Button>
                    {p.status === "pending" && (
                      <>
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => handleApprove(p)}
                        >
                          <Check className="w-4 h-4 mr-1" /> Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleReject(p.id)}
                        >
                          <X className="w-4 h-4 mr-1" /> Reject
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Screenshot Dialog */}
      <Dialog open={!!screenshotDialog} onOpenChange={() => setScreenshotDialog(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Payment Screenshot</DialogTitle>
          </DialogHeader>
          {screenshotDialog && (
            <img src={screenshotDialog} alt="Payment screenshot" className="w-full rounded-lg" />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPanel;
