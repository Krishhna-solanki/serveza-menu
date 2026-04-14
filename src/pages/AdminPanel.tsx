import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  useIsAdmin,
  useAllRestaurants,
  useUpdateRestaurantStatus,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  MoreVertical,
  Settings2,
  Shield,
  ShieldOff,
} from "lucide-react";

const getDaysLeft = (planEndDate: string | null, trialEndDate: string | null, planType: string, planStatus: string): number | null => {
  if (planType === "lifetime") return null;
  if (planStatus === "trial" && trialEndDate) {
    return Math.ceil((new Date(trialEndDate).getTime() - Date.now()) / 86400000);
  }
  if (!planEndDate) return null;
  return Math.ceil((new Date(planEndDate).getTime() - Date.now()) / 86400000);
};

const getEffectiveStatus = (r: any): string => {
  if (r.status === "blocked") return "blocked";
  if (r.plan_status === "trial") {
    if (r.trial_end_date && new Date(r.trial_end_date) < new Date()) return "expired";
    return "trial";
  }
  if (r.plan_status === "expired") return "expired";
  if (r.plan_status === "pending") return "trial"; // treat legacy pending as trial
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

const planBadge = (type: string) => {
  const map: Record<string, { label: string; className: string }> = {
    trial: { label: "Trial", className: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
    monthly: { label: "Monthly", className: "bg-primary/10 text-primary border-primary/20" },
    yearly: { label: "Yearly", className: "bg-primary/15 text-primary border-primary/30" },
    five_year: { label: "5 Year", className: "bg-primary/20 text-primary border-primary/40" },
    lifetime: { label: "Lifetime", className: "bg-primary/25 text-primary border-primary/50 font-semibold" },
  };
  return map[type] || { label: type, className: "" };
};

const AdminPanel = () => {
  const navigate = useNavigate();
  const { user, signOut, loading: authLoading } = useAuth();
  const { isAdmin, isLoading: roleLoading } = useIsAdmin();
  const { data: restaurants, isLoading } = useAllRestaurants();
  const { data: paymentRequests } = useAllPaymentRequests();
  const updateStatus = useUpdateRestaurantStatus();
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
      daysLeft: getDaysLeft(r.plan_end_date, r.trial_end_date, r.plan_type, r.plan_status),
    }));

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (r) => r.name.toLowerCase().includes(q) || (r.mobile && r.mobile.includes(q))
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
          <Button className="mt-4" onClick={() => navigate("/dashboard")}>Go to Dashboard</Button>
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
    const d = getDaysLeft(r.plan_end_date, r.trial_end_date, r.plan_type, r.plan_status);
    return d !== null && d <= 5 && d > 0;
  }).length || 0;
  const pendingPayments = paymentRequests?.filter((p: any) => p.status === "pending").length || 0;

  const handleChangePlan = async (id: string, planType: string) => {
    try {
      const now = new Date();
      let planEndDate: string | null = null;
      switch (planType) {
        case "monthly": planEndDate = new Date(now.getTime() + 30 * 86400000).toISOString(); break;
        case "yearly": planEndDate = new Date(now.getTime() + 365 * 86400000).toISOString(); break;
        case "five_year": planEndDate = new Date(now.getTime() + 1825 * 86400000).toISOString(); break;
        case "lifetime": planEndDate = null; break;
        case "trial": planEndDate = null; break;
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
      await updatePlanDetails.mutateAsync({ id, plan_status: "expired", plan_end_date: new Date().toISOString() });
      toast.success("Plan force expired");
    } catch (err: any) { toast.error(err.message); }
  };

  const handleReactivate = async (id: string) => {
    try {
      await updatePlanDetails.mutateAsync({ id, plan_status: "active" });
      await updateStatus.mutateAsync({ id, status: "active" });
      toast.success("Restaurant reactivated");
    } catch (err: any) { toast.error(err.message); }
  };

  const handleBlock = async (id: string) => {
    try {
      await updateStatus.mutateAsync({ id, status: "blocked" });
      toast.success("Restaurant blocked");
    } catch (err: any) { toast.error(err.message); }
  };

  const handleUnblock = async (id: string) => {
    try {
      await updateStatus.mutateAsync({ id, status: "active" });
      toast.success("Restaurant unblocked");
    } catch (err: any) { toast.error(err.message); }
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
    } catch (err: any) { toast.error(err.message); }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteRestaurant.mutateAsync(id);
      toast.success("Restaurant deleted");
      setDeleteConfirm(null);
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

  const stats = [
    { label: "Total", value: totalRestaurants, icon: Users, color: "text-foreground" },
    { label: "Active", value: activeCount, icon: CheckCircle, color: "text-green-500" },
    { label: "Trial", value: trialCount, icon: Clock, color: "text-blue-500" },
    { label: "Pending", value: pendingCount, icon: Clock, color: "text-yellow-500" },
    { label: "Expired", value: expiredCount, icon: X, color: "text-red-500" },
    { label: "Expiring", value: expiringCount, icon: AlertTriangle, color: "text-orange-500" },
    { label: "Payments", value: pendingPayments, icon: CreditCard, color: "text-primary" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-20">
        <div className="container flex items-center justify-between h-14 px-4">
          <h1 className="font-heading text-lg text-gradient-gold">Super Admin</h1>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={async () => { await signOut(); navigate("/login"); }}
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </header>

      <div className="container max-w-7xl py-5 px-4 space-y-5">
        {/* Stats Row */}
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
          {stats.map((s) => (
            <button
              key={s.label}
              onClick={() => {
                if (s.label === "Expiring") setStatusFilter("expiring");
                else if (s.label === "Active") setStatusFilter("active");
                else if (s.label === "Pending") setStatusFilter("pending");
                else if (s.label === "Trial") setStatusFilter("trial");
                else if (s.label === "Expired") setStatusFilter("expired");
                else if (s.label === "Payments") setActiveTab("payments");
                else setStatusFilter("all");
              }}
              className="bg-card border border-border rounded-xl p-3 text-left transition-all hover:border-primary/30 hover:shadow-sm"
            >
              <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                <s.icon className="w-3.5 h-3.5" />
                <span className="text-[11px] font-medium">{s.label}</span>
              </div>
              <p className={`text-xl font-heading ${s.color}`}>{s.value}</p>
            </button>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-muted/50 rounded-xl p-1">
          {(["restaurants", "payments"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab === "restaurants" ? "Restaurants" : `Payments${pendingPayments > 0 ? ` (${pendingPayments})` : ""}`}
            </button>
          ))}
        </div>

        {/* Restaurants Tab */}
        {activeTab === "restaurants" && (
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            {/* Search & Filter Bar */}
            <div className="p-3 border-b border-border flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or mobile..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[170px] h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="trial">Trial</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                  <SelectItem value="expiring">⚠ Expiring in 5 days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isLoading ? (
              <div className="p-12 text-center text-muted-foreground">Loading...</div>
            ) : filteredRestaurants.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">No restaurants found.</div>
            ) : (
              <div className="divide-y divide-border">
                {filteredRestaurants.map((r) => {
                  const status = statusConfig[r.effectiveStatus] || statusConfig.pending;
                  const plan = planBadge(r.plan_type);
                  const isExpiring = r.daysLeft !== null && r.daysLeft <= 5 && r.daysLeft > 0;
                  const isExpired = r.effectiveStatus === "expired";
                  const isBlocked = r.effectiveStatus === "blocked";

                  return (
                    <div
                      key={r.id}
                      className={`flex items-center gap-4 px-4 py-3 transition-colors hover:bg-muted/30 ${
                        isExpired ? "bg-red-500/5" : isExpiring ? "bg-orange-500/5" : ""
                      }`}
                    >
                      {/* Left: Restaurant Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-foreground text-sm truncate">{r.name}</p>
                          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${status.className}`}>
                            {status.label}
                          </Badge>
                          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${plan.className}`}>
                            {plan.label}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>{r.mobile || "No mobile"}</span>
                          <span>·</span>
                          {r.plan_type === "lifetime" ? (
                            <span className="text-primary font-medium">∞ Lifetime</span>
                          ) : r.daysLeft !== null ? (
                            <span className={`font-semibold ${
                              r.daysLeft <= 0 ? "text-red-500" : r.daysLeft <= 5 ? "text-orange-500" : "text-green-500"
                            }`}>
                              {r.daysLeft <= 0 ? "Expired" : `${r.daysLeft}d left`}
                              {isExpiring && <AlertTriangle className="inline w-3 h-3 ml-0.5" />}
                            </span>
                          ) : (
                            <span>No expiry set</span>
                          )}
                          {r.plan_end_date && r.plan_type !== "lifetime" && (
                            <>
                              <span>·</span>
                              <span>Exp: {new Date(r.plan_end_date).toLocaleDateString()}</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title="Open Menu"
                          onClick={() => window.open(`/menu/${r.slug}`, "_blank")}
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title="Copy Link"
                          onClick={() => {
                            navigator.clipboard.writeText(`${window.location.origin}/menu/${r.slug}`);
                            toast.success("Link copied!");
                          }}
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </Button>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="h-8 gap-1 text-xs px-2.5">
                              <Settings2 className="w-3.5 h-3.5" />
                              Manage
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            {/* Change Plan Sub-menu */}
                            <DropdownMenuSub>
                              <DropdownMenuSubTrigger>
                                <CreditCard className="w-3.5 h-3.5 mr-2" />
                                Change Plan
                              </DropdownMenuSubTrigger>
                              <DropdownMenuSubContent>
                                {["trial", "monthly", "yearly", "five_year", "lifetime"].map((p) => (
                                  <DropdownMenuItem
                                    key={p}
                                    onClick={() => handleChangePlan(r.id, p)}
                                    className={r.plan_type === p ? "bg-accent" : ""}
                                  >
                                    {planLabel(p)}
                                    {r.plan_type === p && <Check className="w-3 h-3 ml-auto" />}
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuSubContent>
                            </DropdownMenuSub>

                            <DropdownMenuItem onClick={() => setExtendDialog({ id: r.id, name: r.name })}>
                              <CalendarPlus className="w-3.5 h-3.5 mr-2" />
                              Extend Expiry
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />

                            {isBlocked ? (
                              <DropdownMenuItem onClick={() => handleUnblock(r.id)}>
                                <ShieldOff className="w-3.5 h-3.5 mr-2" />
                                Unblock
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onClick={() => handleBlock(r.id)}>
                                <Shield className="w-3.5 h-3.5 mr-2" />
                                Block
                              </DropdownMenuItem>
                            )}

                            {r.effectiveStatus !== "expired" && (
                              <DropdownMenuItem onClick={() => handleForceExpire(r.id)} className="text-orange-500">
                                <Ban className="w-3.5 h-3.5 mr-2" />
                                Force Expire
                              </DropdownMenuItem>
                            )}

                            {(isExpired || isBlocked) && (
                              <DropdownMenuItem onClick={() => handleReactivate(r.id)} className="text-green-500">
                                <RefreshCw className="w-3.5 h-3.5 mr-2" />
                                Reactivate
                              </DropdownMenuItem>
                            )}

                            <DropdownMenuSeparator />

                            <DropdownMenuItem
                              onClick={() => setDeleteConfirm(r.id)}
                              className="text-red-500 focus:text-red-500"
                            >
                              <Trash2 className="w-3.5 h-3.5 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Payments Tab */}
        {activeTab === "payments" && (
          <div className="space-y-3">
            {!paymentRequests?.length && (
              <div className="bg-card border border-border rounded-xl p-12 text-center text-muted-foreground">
                No payment requests yet.
              </div>
            )}
            {paymentRequests?.map((p: any) => (
              <div key={p.id} className="bg-card border border-border rounded-xl p-4 transition-all hover:border-primary/20">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-foreground text-sm truncate">
                        {p.restaurants?.name || "Unknown"}
                      </p>
                      <Badge variant="outline" className={paymentStatusColor(p.status)}>
                        {p.status}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                      <span>Plan: {planLabel(p.plan_type)}</span>
                      <span>Amount: ₹{p.amount?.toLocaleString()}</span>
                      {p.upi_transaction_id && <span>UPI: {p.upi_transaction_id}</span>}
                      <span>{new Date(p.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button variant="outline" size="sm" className="h-8" onClick={() => setScreenshotDialog(p.screenshot_url)}>
                      <ImageIcon className="w-3.5 h-3.5 mr-1" /> View
                    </Button>
                    {p.status === "pending" && (
                      <>
                        <Button size="sm" className="h-8 bg-green-600 hover:bg-green-700 text-white" onClick={() => handleApprove(p)}>
                          <Check className="w-3.5 h-3.5 mr-1" /> Approve
                        </Button>
                        <Button size="sm" variant="destructive" className="h-8" onClick={() => handleReject(p.id)}>
                          <X className="w-3.5 h-3.5 mr-1" /> Reject
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

      {/* Delete Confirmation */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Restaurant</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will permanently delete this restaurant and all its data. This cannot be undone.
          </p>
          <div className="flex gap-2 justify-end mt-4">
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteConfirm && handleDelete(deleteConfirm)}>Delete</Button>
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
                <Button key={d} variant={extendDays === d ? "default" : "outline"} size="sm" onClick={() => setExtendDays(d)}>
                  {d}d
                </Button>
              ))}
            </div>
            <Input type="number" value={extendDays} onChange={(e) => setExtendDays(e.target.value)} placeholder="Custom days" />
            <Button className="w-full" onClick={handleExtendExpiry}>Extend by {extendDays} days</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPanel;
