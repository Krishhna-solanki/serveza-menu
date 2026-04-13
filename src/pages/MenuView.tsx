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

  const showLogo = (restaurant as any)?.show_logo !== false;
  const showBanner = (restaurant as any)?.show_banner !== false;

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
        {showBanner && restaurant.cover_url ? (
          <div className="h-40 sm:h-48 relative overflow-hidden">
            <img
              src={restaurant.cover_url}
              alt={restaurant.name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
          </div>
        ) : (
          <div className="h-20 gradient-gold opacity-10" />
        )}

        <div className="absolute top-3 right-3 z-10">
          <button
            onClick={() => setIsDark(!isDark)}
            className="p-2 rounded-full bg-card/80 backdrop-blur-sm border border-border text-foreground"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>

        <div className="container px-4 -mt-8 relative z-10">
          <div className="flex items-end gap-3">
            {showLogo && restaurant.logo_url && (
              <img
                src={restaurant.logo_url}
                alt="Logo"
                className="w-16 h-16 rounded-xl object-cover border-2 border-background shadow-lg"
                loading="lazy"
              />
            )}
            <div className="pb-1">
              <h1 className="font-heading text-xl sm:text-2xl text-foreground">{restaurant.name}</h1>
              <p className="text-xs text-muted-foreground">Digital Menu</p>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Category Tabs */}
      {categories && categories.length > 0 && (
        <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-border mt-4">
          <div
            ref={tabsRef}
            className="container px-4 flex gap-1 overflow-x-auto py-2.5 scrollbar-hide"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {categories.map((cat) => (
              <button
                key={cat.id}
                data-catid={cat.id}
                onClick={() => scrollToCategory(cat.id)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
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

      {/* Menu Items — Compact List */}
      <div className="container px-4 py-4 pb-16">
        {itemsByCategory?.map((cat) => (
          <div
            key={cat.id}
            ref={(el) => { categoryRefs.current[cat.id] = el; }}
            className="mb-6"
          >
            <div className="flex items-center gap-2 mb-3">
              {cat.image_url && (
                <img src={cat.image_url} alt={cat.name} className="w-6 h-6 rounded object-cover" loading="lazy" />
              )}
              <h2 className="font-heading text-base text-foreground">{cat.name}</h2>
              <span className="text-xs text-muted-foreground">({cat.items.length})</span>
            </div>

            <div className="space-y-2">
              {cat.items.map((item, index) => (
                <div
                  key={item.id}
                  className="bg-card border border-border rounded-lg p-3 flex gap-3 animate-fade-in hover:border-primary/30 transition-colors"
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  {/* Thumbnail */}
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                    loading="lazy"
                  />
                  {/* Details */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className={`inline-flex items-center justify-center w-4 h-4 rounded border ${
                          item.is_veg ? "border-green-500" : "border-red-500"
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            item.is_veg ? "bg-green-500" : "bg-red-500"
                          }`} />
                        </span>
                        <h3 className="font-semibold text-sm text-foreground truncate">{item.name}</h3>
                      </div>
                      {item.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{item.description}</p>
                      )}
                    </div>
                    <p className="text-gold font-heading text-sm mt-1">₹{item.price}</p>
                  </div>
                </div>
              ))}
            </div>

            {cat.items.length === 0 && (
              <p className="text-center text-muted-foreground py-3 text-xs">No items in this category yet.</p>
            )}
          </div>
        ))}

        {(!categories || categories.length === 0) && (
          <div className="text-center py-12">
            <p className="text-muted-foreground font-heading text-base">Menu coming soon</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="fixed bottom-0 inset-x-0 bg-card/95 backdrop-blur-md border-t border-border py-2 text-center">
        <p className="text-xs text-muted-foreground">
          Powered by <span className="text-gold font-semibold">Serveza Menu</span>
        </p>
      </div>
    </div>
  );
};

export default MenuView;
