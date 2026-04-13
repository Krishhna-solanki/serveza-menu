import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  useIsAdmin,
  useAllRestaurants,
  useUpdateRestaurantStatus,
  useUpdateRestaurantPlan,
  useUpdateRestaurantPlanDetails,
  useDeleteRestaurant,
} from "@/hooks/useAdmin";
import {
  useAllPaymentRequests,
  useApprovePayment,
  useRejectPayment,
} from "@/hooks/usePayments";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  LogOut,
  Copy,
  Users,
  CheckCircle,
  Clock,
  CreditCard,
  ImageIcon,
  X,
  Check,
  Search,
  ExternalLink,
  Trash2,
  AlertTriangle,
  CalendarPlus,
  Ban,
  RefreshCw,
} from "lucide-react";

const getDaysLeft = (planEndDate: string | null, planType: string): number | null => {
  if (planType === "lifetime") return null;
  if (!planEndDate) return null;
  const now = new Date();
  const end = new Date(planEndDate);
  return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
};

const getEffectiveStatus = (r: any): string => {
  if (r.status === "blocked") return "blocked";
  if (r.plan_status === "trial") {
    if (r.trial_end_date && new Date(r.trial_end_date) < new Date()) return "expired";
    return "trial";
  }
  if (r.plan_status === "expired") return "expired";
  if (r.plan_status === "pending") return "pending";
  if (r.plan_type === "lifetime") return "active";
  if (r.plan_end_date && new Date(r.plan_end_date) < new Date()) return "expired";
  if (r.plan_status === "active") return "active";
  return r.status;
};

const statusConfig: Record<string, { label: string; className: string }> = {
  active: { label: "Active", className: "bg-green-500/10 text-green-500 border-green-500/20" },
  pending: { label: "Pending", className: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" },
  expired: { label: "Expired", className: "bg-red-500/10 text-red-500 border-red-500/20" },
  blocked: { label: "Blocked", className: "bg-muted text-muted-foreground border-border" },
  trial: { label: "Trial", className: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
};

const AdminPanel = () => {
  const navigate = useNavigate();
  const { user, signOut, loading: authLoading } = useAuth();
  const { isAdmin, isLoading: roleLoading } = useIsAdmin();
  const { data: restaurants, isLoading } = useAllRestaurants();
  const { data: paymentRequests } = useAllPaymentRequests();
  const updateStatus = useUpdateRestaurantStatus();
  const updatePlan = useUpdateRestaurantPlan();
  const updatePlanDetails = useUpdateRestaurantPlanDetails();
  const deleteRestaurant = useDeleteRestaurant();
  const approvePayment = useApprovePayment();
  const rejectPayment = useRejectPayment();

  const [activeTab, setActiveTab] = useState<"restaurants" | "payments">("restaurants");
  const [screenshotDialog, setScreenshotDialog] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [extendDialog, setExtendDialog] = useState<{ id: string; name: string } | null>(null);
  const [extendDays, setExtendDays] = useState("30");

  const filteredRestaurants = useMemo(() => {
    if (!restaurants) return [];
    let list = restaurants.map((r) => ({
      ...r,
      effectiveStatus: getEffectiveStatus(r),
      daysLeft: getDaysLeft(r.plan_end_date, r.plan_type),
    }));

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          (r.mobile && r.mobile.includes(q))
      );
    }

    if (statusFilter === "expiring") {
      list = list.filter((r) => r.daysLeft !== null && r.daysLeft <= 5 && r.daysLeft > 0);
    } else if (statusFilter !== "all") {
      list = list.filter((r) => r.effectiveStatus === statusFilter);
    }

    return list;
  }, [restaurants, searchQuery, statusFilter]);

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
          <Button className="mt-4" onClick={() => navigate("/dashboard")}>
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const totalRestaurants = restaurants?.length || 0;
  const activeCount = restaurants?.filter((r) => getEffectiveStatus(r) === "active").length || 0;
  const pendingCount = restaurants?.filter((r) => getEffectiveStatus(r) === "pending").length || 0;
  const trialCount = restaurants?.filter((r) => getEffectiveStatus(r) === "trial").length || 0;
  const expiredCount = restaurants?.filter((r) => getEffectiveStatus(r) === "expired").length || 0;
  const expiringCount = restaurants?.filter((r) => {
    const d = getDaysLeft(r.plan_end_date, r.plan_type);
    return d !== null && d <= 5 && d > 0;
  }).length || 0;
  const pendingPayments = paymentRequests?.filter((p: any) => p.status === "pending").length || 0;

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await updateStatus.mutateAsync({ id, status });
      toast.success(`Status updated to ${status}`);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleChangePlan = async (id: string, planType: string) => {
    try {
      const now = new Date();
      let planEndDate: string | null = null;
      switch (planType) {
        case "monthly":
          planEndDate = new Date(now.getTime() + 30 * 86400000).toISOString();
          break;
        case "yearly":
          planEndDate = new Date(now.getTime() + 365 * 86400000).toISOString();
          break;
        case "five_year":
          planEndDate = new Date(now.getTime() + 1825 * 86400000).toISOString();
          break;
        case "lifetime":
          planEndDate = null;
          break;
        case "trial":
          planEndDate = null;
          break;
      }
      await updatePlanDetails.mutateAsync({
        id,
        plan_type: planType,
        plan_status: planType === "trial" ? "trial" : "active",
        plan_end_date: planEndDate,
      });
      toast.success(`Plan changed to ${planType}`);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleForceExpire = async (id: string) => {
    try {
      await updatePlanDetails.mutateAsync({
        id,
        plan_status: "expired",
        plan_end_date: new Date().toISOString(),
      });
      toast.success("Plan force expired");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleReactivate = async (id: string) => {
    try {
      await updatePlanDetails.mutateAsync({ id, plan_status: "active" });
      await updateStatus.mutateAsync({ id, status: "active" });
      toast.success("Restaurant reactivated");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleExtendExpiry = async () => {
    if (!extendDialog) return;
    try {
      const restaurant = restaurants?.find((r) => r.id === extendDialog.id);
      const base = restaurant?.plan_end_date ? new Date(restaurant.plan_end_date) : new Date();
      const newDate = new Date(base.getTime() + parseInt(extendDays) * 86400000);
      await updatePlanDetails.mutateAsync({
        id: extendDialog.id,
        plan_end_date: newDate.toISOString(),
        plan_status: "active",
      });
      toast.success(`Extended by ${extendDays} days`);
      setExtendDialog(null);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteRestaurant.mutateAsync(id);
      toast.success("Restaurant deleted");
      setDeleteConfirm(null);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleApprove = async (payment: any) => {
    try {
      await approvePayment.mutateAsync({
        paymentId: payment.id,
        restaurantId: payment.restaurant_id,
        planType: payment.plan_type,
      });
      toast.success("Payment approved and plan activated!");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleReject = async (paymentId: string) => {
    try {
      await rejectPayment.mutateAsync({ paymentId, notes: "Payment rejected by admin" });
      toast.success("Payment rejected");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const planLabel = (type: string) => {
    switch (type) {
      case "monthly": return "Monthly";
      case "yearly": return "Yearly";
      case "five_year": return "5 Year";
      case "lifetime": return "Lifetime";
      case "trial": return "Trial";
      default: return type;
    }
  };

  const paymentStatusColor = (status: string) => {
    switch (status) {
      case "approved": return "bg-green-500/10 text-green-500 border-green-500/20";
      case "pending": return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "rejected": return "bg-red-500/10 text-red-500 border-red-500/20";
      default: return "";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="container flex items-center justify-between h-16 px-4">
          <h1 className="font-heading text-xl text-gradient-gold">Super Admin Panel</h1>
          <Button
            variant="ghost"
            size="sm"
            onClick={async () => {
              await signOut();
              navigate("/login");
            }}
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </header>

      <div className="container max-w-7xl py-6 px-4">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
          {[
            { label: "Total", value: totalRestaurants, icon: Users, color: "text-foreground" },
            { label: "Active", value: activeCount, icon: CheckCircle, color: "text-green-500" },
            { label: "Trial", value: trialCount, icon: Clock, color: "text-blue-500" },
            { label: "Pending", value: pendingCount, icon: Clock, color: "text-yellow-500" },
            { label: "Expired", value: expiredCount, icon: X, color: "text-red-500" },
            { label: "Expiring Soon", value: expiringCount, icon: AlertTriangle, color: "text-orange-500" },
            { label: "Payments", value: pendingPayments, icon: CreditCard, color: "text-primary" },
          ].map((s) => (
            <div key={s.label} className="bg-card border border-border rounded-lg p-3">
              <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                <s.icon className="w-3.5 h-3.5" />
                <span className="text-[11px]">{s.label}</span>
              </div>
              <p className={`text-xl font-heading ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-4 bg-muted rounded-lg p-1">
          {[
            { id: "restaurants" as const, label: "Restaurants" },
            {
              id: "payments" as const,
              label: `Payments${pendingPayments > 0 ? ` (${pendingPayments})` : ""}`,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Restaurants Tab */}
        {activeTab === "restaurants" && (
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            {/* Search & Filters */}
            <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or mobile..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="trial">Trial</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                  <SelectItem value="expiring">Expiring in 5 days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground">Loading...</div>
            ) : filteredRestaurants.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">No restaurants found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left p-3 text-muted-foreground font-medium text-xs">Restaurant</th>
                      <th className="text-left p-3 text-muted-foreground font-medium text-xs">Mobile</th>
                      <th className="text-left p-3 text-muted-foreground font-medium text-xs">Status</th>
                      <th className="text-left p-3 text-muted-foreground font-medium text-xs">Plan</th>
                      <th className="text-left p-3 text-muted-foreground font-medium text-xs">Expiry</th>
                      <th className="text-left p-3 text-muted-foreground font-medium text-xs">Days Left</th>
                      <th className="text-left p-3 text-muted-foreground font-medium text-xs">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRestaurants.map((r) => {
                      const status = statusConfig[r.effectiveStatus] || statusConfig.pending;
                      const isExpiring = r.daysLeft !== null && r.daysLeft <= 5 && r.daysLeft > 0;
                      const isExpired = r.effectiveStatus === "expired";

                      return (
                        <tr
                          key={r.id}
                          className={`border-b border-border last:border-0 hover:bg-muted/50 ${
                            isExpired ? "bg-red-500/5" : isExpiring ? "bg-orange-500/5" : ""
                          }`}
                        >
                          <td className="p-3">
                            <p className="font-medium text-foreground">{r.name}</p>
                            <p className="text-[11px] text-muted-foreground">{r.slug}</p>
                          </td>
                          <td className="p-3 text-muted-foreground text-xs">{r.mobile || "—"}</td>
                          <td className="p-3">
                            <Badge variant="outline" className={status.className}>
                              {status.label}
                            </Badge>
                          </td>
                          <td className="p-3">
                            <Select
                              value={r.plan_type}
                              onValueChange={(v) => handleChangePlan(r.id, v)}
                            >
                              <SelectTrigger className="w-[100px] h-7 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="trial">Trial</SelectItem>
                                <SelectItem value="monthly">Monthly</SelectItem>
                                <SelectItem value="yearly">Yearly</SelectItem>
                                <SelectItem value="five_year">5 Year</SelectItem>
                                <SelectItem value="lifetime">Lifetime</SelectItem>
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="p-3 text-xs text-muted-foreground">
                            {r.plan_type === "lifetime" ? (
                              <span className="text-primary">∞ Lifetime</span>
                            ) : r.plan_end_date ? (
                              new Date(r.plan_end_date).toLocaleDateString()
                            ) : r.trial_end_date ? (
                              new Date(r.trial_end_date).toLocaleDateString()
                            ) : (
                              "—"
                            )}
                          </td>
                          <td className="p-3">
                            {r.plan_type === "lifetime" ? (
                              <span className="text-xs text-primary">∞</span>
                            ) : r.daysLeft !== null ? (
                              <span
                                className={`text-xs font-semibold ${
                                  r.daysLeft <= 0
                                    ? "text-red-500"
                                    : r.daysLeft <= 5
                                    ? "text-orange-500"
                                    : "text-green-500"
                                }`}
                              >
                                {r.daysLeft <= 0 ? "Expired" : `${r.daysLeft}d`}
                                {isExpiring && (
                                  <AlertTriangle className="inline w-3 h-3 ml-1" />
                                )}
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-1 flex-wrap">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                title="Open Menu"
                                onClick={() => window.open(`/menu/${r.slug}`, "_blank")}
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                title="Copy Link"
                                onClick={() => {
                                  navigator.clipboard.writeText(
                                    `${window.location.origin}/menu/${r.slug}`
                                  );
                                  toast.success("Copied!");
                                }}
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                title="Extend Expiry"
                                onClick={() => setExtendDialog({ id: r.id, name: r.name })}
                              >
                                <CalendarPlus className="w-3.5 h-3.5" />
                              </Button>
                              {r.effectiveStatus !== "expired" && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-orange-500"
                                  title="Force Expire"
                                  onClick={() => handleForceExpire(r.id)}
                                >
                                  <Ban className="w-3.5 h-3.5" />
                                </Button>
                              )}
                              {(r.effectiveStatus === "expired" ||
                                r.effectiveStatus === "blocked") && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-green-500"
                                  title="Reactivate"
                                  onClick={() => handleReactivate(r.id)}
                                >
                                  <RefreshCw className="w-3.5 h-3.5" />
                                </Button>
                              )}
                              <Select
                                value={r.status}
                                onValueChange={(v) => handleStatusChange(r.id, v)}
                              >
                                <SelectTrigger className="w-[80px] h-7 text-[11px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pending">Pending</SelectItem>
                                  <SelectItem value="active">Active</SelectItem>
                                  <SelectItem value="blocked">Blocked</SelectItem>
                                </SelectContent>
                              </Select>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-red-500"
                                title="Delete"
                                onClick={() => setDeleteConfirm(r.id)}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
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
                      <p className="font-medium text-foreground">
                        {p.restaurants?.name || "Unknown"}
                      </p>
                      <Badge variant="outline" className={paymentStatusColor(p.status)}>
                        {p.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Plan: {planLabel(p.plan_type)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Amount: ₹{p.amount?.toLocaleString()}
                    </p>
                    {p.upi_transaction_id && (
                      <p className="text-sm text-muted-foreground">
                        UPI Txn: {p.upi_transaction_id}
                      </p>
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Restaurant</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will permanently delete this restaurant and all its data. This cannot be undone.
          </p>
          <div className="flex gap-2 justify-end mt-4">
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => deleteConfirm && handleDelete(deleteConfirm)}>
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Extend Expiry Dialog */}
      <Dialog open={!!extendDialog} onOpenChange={() => setExtendDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Extend Expiry — {extendDialog?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Add days to the current expiry date:</p>
            <div className="flex gap-2">
              {["7", "30", "90", "365"].map((d) => (
                <Button
                  key={d}
                  variant={extendDays === d ? "default" : "outline"}
                  size="sm"
                  onClick={() => setExtendDays(d)}
                >
                  {d}d
                </Button>
              ))}
            </div>
            <Input
              type="number"
              value={extendDays}
              onChange={(e) => setExtendDays(e.target.value)}
              placeholder="Custom days"
            />
            <Button className="w-full" onClick={handleExtendExpiry}>
              Extend by {extendDays} days
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPanel;
