import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useIsAdmin, useAllRestaurants, useUpdateRestaurantStatus, useUpdateRestaurantPlan } from "@/hooks/useAdmin";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { LogOut, Copy, Users, CheckCircle, Clock, CreditCard } from "lucide-react";

const AdminPanel = () => {
  const navigate = useNavigate();
  const { user, signOut, loading: authLoading } = useAuth();
  const { isAdmin, isLoading: roleLoading } = useIsAdmin();
  const { data: restaurants, isLoading } = useAllRestaurants();
  const updateStatus = useUpdateRestaurantStatus();
  const updatePlan = useUpdateRestaurantPlan();

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-gold animate-pulse font-heading text-2xl">Loading...</div>
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

  const statusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-500/10 text-green-500 border-green-500/20";
      case "pending": return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "blocked": return "bg-red-500/10 text-red-500 border-red-500/20";
      default: return "";
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await updateStatus.mutateAsync({ id, status });
      toast.success(`Status updated to ${status}`);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handlePlanChange = async (id: string, plan: string) => {
    try {
      await updatePlan.mutateAsync({ id, plan });
      toast.success(`Plan updated to ${plan}`);
    } catch (err: any) {
      toast.error(err.message);
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
        {/* Analytics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Users className="w-4 h-4" />
              <span className="text-sm">Total Restaurants</span>
            </div>
            <p className="text-2xl font-heading text-foreground">{totalRestaurants}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm">Active</span>
            </div>
            <p className="text-2xl font-heading text-green-500">{activeCount}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Clock className="w-4 h-4" />
              <span className="text-sm">Pending</span>
            </div>
            <p className="text-2xl font-heading text-yellow-500">{pendingCount}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <CreditCard className="w-4 h-4" />
              <span className="text-sm">Paid</span>
            </div>
            <p className="text-2xl font-heading text-gold">{paidCount}</p>
          </div>
        </div>

        {/* Restaurants Table */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="p-4 border-b border-border">
            <h2 className="font-heading text-lg text-foreground">All Restaurants</h2>
          </div>
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Loading restaurants...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-4 text-muted-foreground font-medium">Name</th>
                    <th className="text-left p-4 text-muted-foreground font-medium">Mobile</th>
                    <th className="text-left p-4 text-muted-foreground font-medium">Status</th>
                    <th className="text-left p-4 text-muted-foreground font-medium">Plan</th>
                    <th className="text-left p-4 text-muted-foreground font-medium">Menu Link</th>
                    <th className="text-left p-4 text-muted-foreground font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {restaurants?.map((r) => (
                    <tr key={r.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                      <td className="p-4">
                        <div>
                          <p className="font-medium text-foreground">{r.name}</p>
                          <p className="text-xs text-muted-foreground">{r.slug}</p>
                        </div>
                      </td>
                      <td className="p-4 text-muted-foreground">{r.mobile || "—"}</td>
                      <td className="p-4">
                        <Badge variant="outline" className={statusColor(r.status)}>
                          {r.status}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <Badge variant="outline" className={r.plan === "paid" ? "bg-gold/10 text-gold border-gold/20" : ""}>
                          {r.plan}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText(`${window.location.origin}/menu/${r.slug}`);
                            toast.success("Link copied!");
                          }}
                        >
                          <Copy className="w-3 h-3 mr-1" /> Copy
                        </Button>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <Select value={r.status} onValueChange={(v) => handleStatusChange(r.id, v)}>
                            <SelectTrigger className="w-[110px] h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="blocked">Blocked</SelectItem>
                            </SelectContent>
                          </Select>
                          <Select value={r.plan} onValueChange={(v) => handlePlanChange(r.id, v)}>
                            <SelectTrigger className="w-[90px] h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
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
          {restaurants?.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">No restaurants registered yet.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
