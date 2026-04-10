import React, { useState, useRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useRestaurantBySlug, useCategories, useMenuItems } from "@/hooks/useRestaurant";
import { Moon, Sun } from "lucide-react";

const MenuView = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: restaurant, isLoading } = useRestaurantBySlug(slug || "");
  const { data: categories } = useCategories(restaurant?.id);
  const { data: menuItems } = useMenuItems(restaurant?.id);
  const [isDark, setIsDark] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const categoryRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const tabsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    return () => document.documentElement.classList.remove("dark");
  }, [isDark]);

  useEffect(() => {
    if (categories?.length && !activeCategory) {
      setActiveCategory(categories[0].id);
    }
  }, [categories, activeCategory]);

  const scrollToCategory = (catId: string) => {
    setActiveCategory(catId);
    const el = categoryRefs.current[catId];
    if (el) {
      const offset = 120;
      const top = el.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: "smooth" });
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      if (!categories) return;
      const offset = 130;
      for (const cat of categories) {
        const el = categoryRefs.current[cat.id];
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= offset && rect.bottom > offset) {
            setActiveCategory(cat.id);
            break;
          }
        }
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [categories]);

  // Auto-scroll active tab into view
  useEffect(() => {
    if (activeCategory && tabsRef.current) {
      const activeTab = tabsRef.current.querySelector(`[data-catid="${activeCategory}"]`) as HTMLElement;
      if (activeTab) {
        activeTab.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
      }
    }
  }, [activeCategory]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-gold animate-pulse font-heading text-2xl">Loading menu...</div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="font-heading text-2xl text-foreground mb-2">Menu Not Found</h1>
          <p className="text-muted-foreground">This restaurant link may be invalid.</p>
        </div>
      </div>
    );
  }

  const itemsByCategory = categories?.map((cat) => ({
    ...cat,
    items: menuItems?.filter((item) => item.category_id === cat.id && item.is_available) || [],
  }));

  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      {/* Hero Section */}
      <div className="relative">
        {restaurant.cover_url ? (
          <div className="h-48 sm:h-56 relative overflow-hidden">
            <img
              src={restaurant.cover_url}
              alt={restaurant.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
          </div>
        ) : (
          <div className="h-32 gradient-gold opacity-20" />
        )}

        <div className="absolute top-4 right-4 z-10">
          <button
            onClick={() => setIsDark(!isDark)}
            className="p-2 rounded-full bg-card/80 backdrop-blur-sm border border-border text-foreground"
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>

        <div className="container px-4 -mt-12 relative z-10">
          <div className="flex items-end gap-4">
            {restaurant.logo_url && (
              <img
                src={restaurant.logo_url}
                alt="Logo"
                className="w-20 h-20 rounded-2xl object-cover border-4 border-background shadow-lg"
              />
            )}
            <div className="pb-1">
              <h1 className="font-heading text-2xl sm:text-3xl text-foreground">{restaurant.name}</h1>
              <p className="text-sm text-muted-foreground mt-1">Digital Menu</p>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Category Tabs */}
      {categories && categories.length > 0 && (
        <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-border mt-6">
          <div
            ref={tabsRef}
            className="container px-4 flex gap-1 overflow-x-auto py-3 scrollbar-hide"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {categories.map((cat) => (
              <button
                key={cat.id}
                data-catid={cat.id}
                onClick={() => scrollToCategory(cat.id)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                  activeCategory === cat.id
                    ? "gradient-gold text-primary-foreground shadow-gold"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Menu Items */}
      <div className="container px-4 py-6 pb-20">
        {itemsByCategory?.map((cat) => (
          <div
            key={cat.id}
            ref={(el) => { categoryRefs.current[cat.id] = el; }}
            className="mb-8"
          >
            <div className="flex items-center gap-3 mb-4">
              {cat.image_url && (
                <img src={cat.image_url} alt={cat.name} className="w-8 h-8 rounded-lg object-cover" />
              )}
              <h2 className="font-heading text-xl text-foreground">{cat.name}</h2>
              <span className="text-sm text-muted-foreground">({cat.items.length})</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {cat.items.map((item, index) => (
                <div
                  key={item.id}
                  className="bg-card border border-border rounded-xl overflow-hidden animate-slide-up hover:shadow-lg transition-shadow"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="aspect-[16/10] relative overflow-hidden">
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    <div className="absolute top-3 left-3">
                      <span className={`inline-flex items-center justify-center w-5 h-5 rounded border-2 ${
                        item.is_veg ? "border-green-500" : "border-red-500"
                      }`}>
                        <span className={`w-2 h-2 rounded-full ${
                          item.is_veg ? "bg-green-500" : "bg-red-500"
                        }`} />
                      </span>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-foreground">{item.name}</h3>
                    {item.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{item.description}</p>
                    )}
                    <p className="text-gold font-heading text-lg mt-2">₹{item.price}</p>
                  </div>
                </div>
              ))}
            </div>

            {cat.items.length === 0 && (
              <p className="text-center text-muted-foreground py-4 text-sm">No items in this category yet.</p>
            )}
          </div>
        ))}

        {(!categories || categories.length === 0) && (
          <div className="text-center py-16">
            <p className="text-muted-foreground font-heading text-lg">Menu coming soon</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="fixed bottom-0 inset-x-0 bg-card/95 backdrop-blur-md border-t border-border py-3 text-center">
        <p className="text-xs text-muted-foreground">
          Powered by <span className="text-gold font-semibold">Serveza Menu</span>
        </p>
      </div>
    </div>
  );
};

export default MenuView;
