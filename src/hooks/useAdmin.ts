import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useUserRole = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["user_role", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data?.role as "admin" | "user" | null;
    },
    enabled: !!user,
  });
};

export const useIsAdmin = () => {
  const { data: role, isLoading } = useUserRole();
  return { isAdmin: role === "admin", isLoading };
};

export const useAllRestaurants = () => {
  return useQuery({
    queryKey: ["admin_restaurants"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("restaurants")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
};

export const useUpdateRestaurantStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("restaurants")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin_restaurants"] }),
  });
};

export const useUpdateRestaurantPlan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, plan }: { id: string; plan: string }) => {
      const { error } = await supabase
        .from("restaurants")
        .update({ plan })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin_restaurants"] }),
  });
};

export const useUpdateRestaurantPlanDetails = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      plan_type,
      plan_status,
      plan_end_date,
    }: {
      id: string;
      plan_type?: string;
      plan_status?: string;
      plan_end_date?: string | null;
    }) => {
      const updates: Record<string, any> = {};
      if (plan_type !== undefined) updates.plan_type = plan_type;
      if (plan_status !== undefined) updates.plan_status = plan_status;
      if (plan_end_date !== undefined) updates.plan_end_date = plan_end_date;
      const { error } = await supabase
        .from("restaurants")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin_restaurants"] }),
  });
};

export const useDeleteRestaurant = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("restaurants")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin_restaurants"] }),
  });
};
