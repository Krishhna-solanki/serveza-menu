import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useRestaurant, useCreateRestaurant, useCategories, useMenuItems, useUpdateRestaurant, useCreateCategory, useUpdateCategory, useDeleteCategory, useCreateMenuItem, useUpdateMenuItem, useDeleteMenuItem } from "@/hooks/useRestaurant";
import { useCheckDevice } from "@/hooks/useDeviceFingerprint";
import OTPVerification from "@/components/OTPVerification";
import { OTP_VERIFICATION_ENABLED } from "@/lib/featureFlags";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { uploadFile } from "@/lib/storage";
import { Plus, Pencil, Trash2, LogOut, Eye, Image, Download, Clock, Crown, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { QRCodeCanvas } from "qrcode.react";

const SetupRestaurant = ({ userId }: { userId: string }) => {
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [loading, setLoading] = useState(false);
  const createRestaurant = useCreateRestaurant();

  const generateSlug = (n: string) =>
    n.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-") + "-" + Math.random().toString(36).substring(2, 8);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      await createRestaurant.mutateAsync({
        name, slug: generateSlug(name), user_id: userId, mobile,
      });
      toast.success("Restaurant created!");
    } catch (err: any) {
      toast.error(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-heading text-gradient-gold mb-2">Welcome!</h1>
          <p className="text-muted-foreground">Set up your restaurant to get started</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-6 shadow-lg">
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <Label>Restaurant Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. The Golden Spoon" required />
            </div>
            <div>
              <Label>Mobile Number</Label>
              <Input value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder="+91 9876543210" />
            </div>
            <Button type="submit" className="w-full gradient-gold text-primary-foreground font-semibold" disabled={loading}>
              {loading ? "Creating..." : "Create Restaurant"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, signOut, loading: authLoading } = useAuth();
  const { data: restaurant, isLoading } = useRestaurant();
  const { data: categories } = useCategories(restaurant?.id);
  const { data: menuItems } = useMenuItems(restaurant?.id);
  const updateRestaurant = useUpdateRestaurant();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();
  const createMenuItem = useCreateMenuItem();
  const updateMenuItem = useUpdateMenuItem();
  const deleteMenuItem = useDeleteMenuItem();
  const { isNewDevice, loading: deviceLoading, trustDevice, updateLastUsed } = useCheckDevice(OTP_VERIFICATION_ENABLED ? user?.id : undefined);
  const [deviceVerified, setDeviceVerified] = useState(false);

  const [activeTab, setActiveTab] = useState<"profile" | "categories" | "items">("profile");
  const [categoryDialog, setCategoryDialog] = useState(false);
  const [itemDialog, setItemDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [editingItem, setEditingItem] = useState<any>(null);

  // Category form
  const [catName, setCatName] = useState("");
  const [catImage, setCatImage] = useState<File | null>(null);

  // Item form
  const [itemForm, setItemForm] = useState({
    name: "", description: "", price: "", category_id: "", is_veg: true,
  });
  const [itemImage, setItemImage] = useState<File | null>(null);

  if (authLoading || isLoading || deviceLoading) {
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

  // New device detected - require OTP verification
  if (isNewDevice && !deviceVerified) {
    return (
      <OTPVerification
        email={user.email || ""}
        userId={user.id}
        purpose="device_verification"
        onVerified={async () => {
          await trustDevice();
          setDeviceVerified(true);
        }}
        onCancel={async () => {
          await signOut();
          navigate("/login");
        }}
      />
    );
  }

  if (!restaurant) {
    return <SetupRestaurant userId={user.id} />;
  }

  // Check plan expiry
  const isPlanExpired = () => {
    if (!restaurant) return false;
    const r = restaurant as any;
    if (r.plan_type === "lifetime") return false;
    if (r.plan_status === "active" && r.plan_end_date) {
      return new Date(r.plan_end_date) < new Date();
    }
    if (r.plan_status === "trial" && r.trial_end_date) {
      return new Date(r.trial_end_date) < new Date();
    }
    return r.plan_status === "expired";
  };

  const planExpired = isPlanExpired();

  if (restaurant.status === "blocked") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="text-center animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-muted-foreground" />
          </div>
          <h1 className="font-heading text-2xl text-foreground mb-2">Account Blocked</h1>
          <p className="text-muted-foreground max-w-md">
            Your account has been blocked. Please contact support for assistance.
          </p>
          <Button variant="outline" className="mt-6" onClick={async () => { await signOut(); navigate("/login"); }}>
            <LogOut className="w-4 h-4 mr-2" /> Sign Out
          </Button>
        </div>
      </div>
    );
  }

  if (planExpired) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="text-center animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-yellow-500" />
          </div>
          <h1 className="font-heading text-2xl text-foreground mb-2">
            {(restaurant as any).plan_status === "trial" ? "Free Trial Expired" : "Plan Expired"}
          </h1>
          <p className="text-muted-foreground max-w-md">
            {(restaurant as any).plan_status === "trial"
              ? "Your 7-day free trial has ended. Upgrade to continue managing your menu."
              : "Your plan has expired. Please renew to continue using all features."}
          </p>
          <div className="flex gap-3 mt-6 justify-center">
            <Button className="gradient-gold text-primary-foreground" onClick={() => navigate("/pricing")}>
              <Crown className="w-4 h-4 mr-2" /> Upgrade Plan
            </Button>
            <Button variant="outline" onClick={async () => { await signOut(); navigate("/login"); }}>
              <LogOut className="w-4 h-4 mr-2" /> Sign Out
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !restaurant) return;
    const url = await uploadFile(file, `${restaurant.id}/logo`);
    if (url) {
      await updateRestaurant.mutateAsync({ id: restaurant.id, logo_url: url });
      toast.success("Logo updated!");
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !restaurant) return;
    const url = await uploadFile(file, `${restaurant.id}/cover`);
    if (url) {
      await updateRestaurant.mutateAsync({ id: restaurant.id, cover_url: url });
      toast.success("Cover updated!");
    }
  };

  const handleSaveCategory = async () => {
    if (!restaurant || !catName.trim()) return;
    let imageUrl = editingCategory?.image_url || null;
    if (catImage) {
      imageUrl = await uploadFile(catImage, `${restaurant.id}/categories`);
    }
    if (editingCategory) {
      await updateCategory.mutateAsync({ id: editingCategory.id, name: catName, image_url: imageUrl });
      toast.success("Category updated!");
    } else {
      await createCategory.mutateAsync({ name: catName, restaurant_id: restaurant.id, image_url: imageUrl });
      toast.success("Category added!");
    }
    setCategoryDialog(false);
    setCatName("");
    setCatImage(null);
    setEditingCategory(null);
  };

  const handleSaveItem = async () => {
    if (!restaurant || !itemForm.name.trim() || !itemForm.category_id) return;
    let imageUrl = editingItem?.image_url || "";
    if (itemImage) {
      imageUrl = await uploadFile(itemImage, `${restaurant.id}/items`);
    }
    if (!imageUrl) {
      toast.error("Image is required");
      return;
    }
    if (editingItem) {
      await updateMenuItem.mutateAsync({
        id: editingItem.id, name: itemForm.name, description: itemForm.description,
        price: parseFloat(itemForm.price), image_url: imageUrl, category_id: itemForm.category_id,
        is_veg: itemForm.is_veg,
      });
      toast.success("Item updated!");
    } else {
      await createMenuItem.mutateAsync({
        name: itemForm.name, description: itemForm.description, price: parseFloat(itemForm.price),
        image_url: imageUrl, category_id: itemForm.category_id, restaurant_id: restaurant.id,
        is_veg: itemForm.is_veg,
      });
      toast.success("Item added!");
    }
    setItemDialog(false);
    setItemForm({ name: "", description: "", price: "", category_id: "", is_veg: true });
    setItemImage(null);
    setEditingItem(null);
  };

  const openEditCategory = (cat: any) => {
    setEditingCategory(cat);
    setCatName(cat.name);
    setCategoryDialog(true);
  };

  const openEditItem = (item: any) => {
    setEditingItem(item);
    setItemForm({
      name: item.name, description: item.description || "", price: item.price.toString(),
      category_id: item.category_id, is_veg: item.is_veg,
    });
    setItemDialog(true);
  };

  const tabs = [
    { id: "profile" as const, label: "Profile" },
    { id: "categories" as const, label: "Categories" },
    { id: "items" as const, label: "Menu Items" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="container flex items-center justify-between h-16 px-4">
          <h1 className="font-heading text-xl text-gradient-gold">Serveza Menu</h1>
          <div className="flex items-center gap-2">
            {restaurant && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(`/menu/${restaurant.slug}`, "_blank")}
              >
                <Eye className="w-4 h-4 mr-1" /> View Menu
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={async () => { await signOut(); navigate("/login"); }}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container max-w-4xl py-6 px-4">
        {/* Plan Status Banner */}
        {restaurant && (
          <div className="mb-4 bg-card border border-border rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Crown className="w-5 h-5 text-primary" />
              <div>
                <span className="text-sm font-medium text-foreground capitalize">
                  {(restaurant as any).plan_type === "trial" ? "Free Trial" : (restaurant as any).plan_type} Plan
                </span>
                {(restaurant as any).plan_end_date && (
                  <span className="text-xs text-muted-foreground ml-2">
                    Expires: {new Date((restaurant as any).plan_end_date).toLocaleDateString()}
                  </span>
                )}
                {(restaurant as any).plan_type === "trial" && (restaurant as any).trial_end_date && (
                  <span className="text-xs text-muted-foreground ml-2">
                    Trial ends: {new Date((restaurant as any).trial_end_date).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate("/pricing")}>
              <Crown className="w-3 h-3 mr-1" /> Upgrade
            </Button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-muted rounded-lg p-1">
          {tabs.map((tab) => (
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

        {/* Profile Tab */}
        {activeTab === "profile" && restaurant && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="font-heading text-lg mb-4 text-foreground">Restaurant Profile</h2>
              <div className="space-y-4">
                <div>
                  <Label>Restaurant Name</Label>
                  <Input defaultValue={restaurant.name} onBlur={(e) => {
                    if (e.target.value !== restaurant.name) {
                      updateRestaurant.mutate({ id: restaurant.id, name: e.target.value });
                    }
                  }} />
                </div>
                <div>
                  <Label>Logo</Label>
                  <div className="flex items-center gap-4 mt-1">
                    {restaurant.logo_url && (
                      <img src={restaurant.logo_url} alt="Logo" className="w-16 h-16 rounded-lg object-cover border border-border" />
                    )}
                    <label className="cursor-pointer">
                      <div className="flex items-center gap-2 text-sm text-gold hover:underline">
                        <Image className="w-4 h-4" /> Upload Logo
                      </div>
                      <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                    </label>
                  </div>
                </div>
                <div>
                  <Label>Cover Image</Label>
                  <div className="mt-1">
                    {restaurant.cover_url && (
                      <img src={restaurant.cover_url} alt="Cover" className="w-full h-40 rounded-lg object-cover border border-border mb-2" />
                    )}
                    <label className="cursor-pointer">
                      <div className="flex items-center gap-2 text-sm text-gold hover:underline">
                        <Image className="w-4 h-4" /> Upload Cover
                      </div>
                      <input type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
                    </label>
                  </div>
                </div>
                {/* Display Toggles */}
                <div className="space-y-3 pt-2 border-t border-border">
                  <Label className="text-sm font-medium">Display Settings</Label>
                  <div className="flex items-center justify-between">
                    <Label className="text-sm text-muted-foreground">Show Logo on Menu</Label>
                    <Switch
                      checked={(restaurant as any).show_logo !== false}
                      onCheckedChange={(v) => updateRestaurant.mutate({ id: restaurant.id, show_logo: v })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-sm text-muted-foreground">Show Banner on Menu</Label>
                    <Switch
                      checked={(restaurant as any).show_banner !== false}
                      onCheckedChange={(v) => updateRestaurant.mutate({ id: restaurant.id, show_banner: v })}
                    />
                  </div>
                </div>
                <div>
                  <Label>Menu Link</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input value={`${window.location.origin}/menu/${restaurant.slug}`} readOnly className="text-sm" />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/menu/${restaurant.slug}`);
                        toast.success("Link copied!");
                      }}
                    >
                      Copy
                    </Button>
                </div>
                <div>
                  <Label>QR Code</Label>
                  <div className="mt-2 flex flex-col items-center gap-3 p-4 bg-white rounded-lg border border-border w-fit">
                    <QRCodeCanvas
                      id="menu-qr-code"
                      value={`${window.location.origin}/menu/${restaurant.slug}`}
                      size={200}
                      level="H"
                      bgColor="#ffffff"
                      fgColor="#0d0d0d"
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => {
                      const canvas = document.getElementById("menu-qr-code") as HTMLCanvasElement;
                      if (!canvas) return;
                      const url = canvas.toDataURL("image/png");
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `${restaurant.slug}-qr-code.png`;
                      a.click();
                      toast.success("QR code downloaded!");
                    }}
                  >
                    <Download className="w-4 h-4 mr-1" /> Download QR Code
                  </Button>
                </div>
              </div>
            </div>
            </div>
          </div>
        )}

        {/* Categories Tab */}
        {activeTab === "categories" && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex justify-between items-center">
              <h2 className="font-heading text-lg text-foreground">Categories</h2>
              <Dialog open={categoryDialog} onOpenChange={(open) => { setCategoryDialog(open); if (!open) { setEditingCategory(null); setCatName(""); setCatImage(null); } }}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gradient-gold text-primary-foreground"><Plus className="w-4 h-4 mr-1" /> Add</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="font-heading">{editingCategory ? "Edit" : "Add"} Category</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Name</Label>
                      <Input value={catName} onChange={(e) => setCatName(e.target.value)} placeholder="e.g. Starters" />
                    </div>
                    <div>
                      <Label>Image (optional)</Label>
                      <Input type="file" accept="image/*" onChange={(e) => setCatImage(e.target.files?.[0] || null)} />
                    </div>
                    <Button onClick={handleSaveCategory} className="w-full gradient-gold text-primary-foreground">Save</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            {categories?.map((cat) => (
              <div key={cat.id} className="bg-card border border-border rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {cat.image_url && (
                    <img src={cat.image_url} alt={cat.name} className="w-12 h-12 rounded-lg object-cover" />
                  )}
                  <span className="font-medium text-foreground">{cat.name}</span>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => openEditCategory(cat)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={async () => {
                    await deleteCategory.mutateAsync(cat.id);
                    toast.success("Deleted!");
                  }}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
            {(!categories || categories.length === 0) && (
              <p className="text-center text-muted-foreground py-8">No categories yet. Add your first one!</p>
            )}
          </div>
        )}

        {/* Menu Items Tab */}
        {activeTab === "items" && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex justify-between items-center">
              <h2 className="font-heading text-lg text-foreground">Menu Items</h2>
              <Dialog open={itemDialog} onOpenChange={(open) => { setItemDialog(open); if (!open) { setEditingItem(null); setItemForm({ name: "", description: "", price: "", category_id: "", is_veg: true }); setItemImage(null); } }}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gradient-gold text-primary-foreground" disabled={!categories?.length}>
                    <Plus className="w-4 h-4 mr-1" /> Add
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="font-heading">{editingItem ? "Edit" : "Add"} Menu Item</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Name</Label>
                      <Input value={itemForm.name} onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })} placeholder="e.g. Butter Chicken" />
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Textarea value={itemForm.description} onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })} placeholder="Short description" rows={2} />
                    </div>
                    <div>
                      <Label>Price (₹)</Label>
                      <Input type="number" value={itemForm.price} onChange={(e) => setItemForm({ ...itemForm, price: e.target.value })} placeholder="299" />
                    </div>
                    <div>
                      <Label>Category</Label>
                      <Select value={itemForm.category_id} onValueChange={(v) => setItemForm({ ...itemForm, category_id: v })}>
                        <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                        <SelectContent>
                          {categories?.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Image</Label>
                      <Input type="file" accept="image/*" onChange={(e) => setItemImage(e.target.files?.[0] || null)} />
                    </div>
                    <div className="flex items-center gap-3">
                      <Switch checked={itemForm.is_veg} onCheckedChange={(v) => setItemForm({ ...itemForm, is_veg: v })} />
                      <Label>{itemForm.is_veg ? "Vegetarian" : "Non-Vegetarian"}</Label>
                    </div>
                    <Button onClick={handleSaveItem} className="w-full gradient-gold text-primary-foreground">Save</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            {menuItems?.map((item) => (
              <div key={item.id} className="bg-card border border-border rounded-lg p-4 flex gap-4">
                <img src={item.image_url} alt={item.name} className="w-20 h-20 rounded-lg object-cover flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-sm border-2 flex-shrink-0 ${item.is_veg ? "border-green-500" : "border-red-500"}`}>
                      <span className={`block w-1.5 h-1.5 rounded-full m-auto mt-0.5 ${item.is_veg ? "bg-green-500" : "bg-red-500"}`} />
                    </span>
                    <span className="font-medium text-foreground truncate">{item.name}</span>
                  </div>
                  {item.description && <p className="text-sm text-muted-foreground mt-1 truncate">{item.description}</p>}
                  <p className="text-gold font-semibold mt-1">₹{item.price}</p>
                </div>
                <div className="flex flex-col gap-1">
                  <Button variant="ghost" size="icon" onClick={() => openEditItem(item)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={async () => {
                    await deleteMenuItem.mutateAsync(item.id);
                    toast.success("Deleted!");
                  }}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
            {(!menuItems || menuItems.length === 0) && (
              <p className="text-center text-muted-foreground py-8">
                {categories?.length ? "No items yet. Add your first menu item!" : "Add categories first, then add items."}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
