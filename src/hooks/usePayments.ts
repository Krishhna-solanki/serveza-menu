import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const usePaymentRequests = (restaurantId: string | undefined) => {
  return useQuery({
    queryKey: ["payment_requests", restaurantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payment_requests")
        .select("*")
        .eq("restaurant_id", restaurantId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!restaurantId,
  });
};

export const useCreatePaymentRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      restaurant_id: string;
      user_id: string;
      plan_type: string;
      amount: number;
      screenshot_url: string;
      upi_transaction_id?: string;
    }) => {
      const { data: result, error } = await supabase
        .from("payment_requests")
        .insert(data)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["payment_requests"] }),
  });
};

export const useAllPaymentRequests = () => {
  return useQuery({
    queryKey: ["admin_payment_requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payment_requests")
        .select("*, restaurants(name, slug)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
};

export const useApprovePayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ paymentId, restaurantId, planType }: { paymentId: string; restaurantId: string; planType: string }) => {
      // Calculate plan_end_date
      const now = new Date();
      let planEndDate: string | null = null;
      let planStatus = "active";

      switch (planType) {
        case "monthly":
          planEndDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
          break;
        case "yearly":
          planEndDate = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString();
          break;
        case "five_year":
          planEndDate = new Date(now.getTime() + 1825 * 24 * 60 * 60 * 1000).toISOString();
          break;
        case "lifetime":
          planEndDate = null; // No expiry
          break;
      }

      // Update payment request status
      const { error: payErr } = await supabase
        .from("payment_requests")
        .update({ status: "approved" })
        .eq("id", paymentId);
      if (payErr) throw payErr;

      // Update restaurant plan
      const { error: restErr } = await supabase
        .from("restaurants")
        .update({
          plan_type: planType,
          plan_status: planStatus,
          plan_end_date: planEndDate,
          status: "active",
        })
        .eq("id", restaurantId);
      if (restErr) throw restErr;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_payment_requests"] });
      queryClient.invalidateQueries({ queryKey: ["admin_restaurants"] });
    },
  });
};

export const useRejectPayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ paymentId, notes }: { paymentId: string; notes?: string }) => {
      const { error } = await supabase
        .from("payment_requests")
        .update({ status: "rejected", admin_notes: notes || "Payment rejected" })
        .eq("id", paymentId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin_payment_requests"] }),
  });
};
