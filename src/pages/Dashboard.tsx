import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useRestaurant, useCreateRestaurant, useCategories, useMenuItems, useUpdateRestaurant, useCreateCategory, useUpdateCategory, useDeleteCategory, useCreateMenuItem, useUpdateMenuItem, useDeleteMenuItem } from "@/hooks/useRestaurant";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { uploadFile } from "@/lib/storage";
import { Plus, Pencil, Trash2, LogOut, Eye, Image, QrCode } from "lucide-react";

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

  if (authLoading || isLoading) {
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

  if (!restaurant) {
    return <SetupRestaurant userId={user.id} />;
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
