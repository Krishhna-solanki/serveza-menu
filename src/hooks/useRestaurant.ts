import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useRestaurant = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["restaurant", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("restaurants")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data as (typeof data & { status: string; plan: string }) | null;
    },
    enabled: !!user,
  });
};

export const useRestaurantBySlug = (slug: string) => {
  return useQuery({
    queryKey: ["restaurant", "slug", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("restaurants")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });
};

export const useCreateRestaurant = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; slug: string; user_id: string; mobile?: string; logo_url?: string }) => {
      const { data: result, error } = await supabase.from("restaurants").insert(data).select().single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["restaurant"] }),
  });
};

export const useUpdateRestaurant = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; name?: string; logo_url?: string; cover_url?: string; mobile?: string; show_logo?: boolean; show_banner?: boolean }) => {
      const { error } = await supabase.from("restaurants").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["restaurant"] }),
  });
};

export const useCategories = (restaurantId: string | undefined) => {
  return useQuery({
    queryKey: ["categories", restaurantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("restaurant_id", restaurantId!)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
    enabled: !!restaurantId,
  });
};

export const useCreateCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; restaurant_id: string; image_url?: string; sort_order?: number }) => {
      const { data: result, error } = await supabase.from("categories").insert(data).select().single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["categories"] }),
  });
};

export const useUpdateCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; name?: string; image_url?: string | null; sort_order?: number }) => {
      const { error } = await supabase.from("categories").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["categories"] }),
  });
};

export const useDeleteCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["categories"] }),
  });
};

export const useMenuItems = (restaurantId: string | undefined) => {
  return useQuery({
    queryKey: ["menu_items", restaurantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("menu_items")
        .select("*, categories(name)")
        .eq("restaurant_id", restaurantId!)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
    enabled: !!restaurantId,
  });
};

export const useCreateMenuItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      name: string; description?: string; price: number; image_url: string;
      category_id: string; restaurant_id: string; is_veg?: boolean; sort_order?: number;
    }) => {
      const { data: result, error } = await supabase.from("menu_items").insert(data).select().single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["menu_items"] }),
  });
};

export const useUpdateMenuItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: {
      id: string; name?: string; description?: string; price?: number; image_url?: string;
      category_id?: string; is_veg?: boolean; is_available?: boolean; sort_order?: number;
    }) => {
      const { error } = await supabase.from("menu_items").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["menu_items"] }),
  });
};

export const useDeleteMenuItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("menu_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["menu_items"] }),
  });
};
