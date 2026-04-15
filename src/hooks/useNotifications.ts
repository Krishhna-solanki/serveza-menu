import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

export const useNotifications = (userId: string | undefined) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["notifications", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  // Realtime subscription
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel("notifications-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ["notifications", userId] });
          // Play notification sound
          try {
            const audio = new Audio("data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbsGczFjlwr9v/jEQaI1OYy+WcWC0cRIK43OaJOiAqZKHW5ZlKHyVPfLS31UkiJ1B/tMnViSEkUIG2ydOIISdQfrPJ1IghJ1B+s8nUiCEnUH60ydSIISdQfrTJ1IghJ1B+tMnUiA==");
            audio.volume = 0.3;
            audio.play().catch(() => {});
          } catch {}
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);

  return query;
};

export const useUnreadCount = (userId: string | undefined) => {
  return useQuery({
    queryKey: ["notifications-unread", userId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("is_read", false);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!userId,
    refetchInterval: 30000,
  });
};

export const useMarkNotificationRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-unread"] });
    },
  });
};

export const useMarkAllRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true } as any)
        .eq("is_read", false);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-unread"] });
    },
  });
};
