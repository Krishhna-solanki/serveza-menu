
-- Add plan management columns to restaurants
ALTER TABLE public.restaurants 
  ADD COLUMN IF NOT EXISTS plan_type text NOT NULL DEFAULT 'trial',
  ADD COLUMN IF NOT EXISTS plan_status text NOT NULL DEFAULT 'trial',
  ADD COLUMN IF NOT EXISTS plan_end_date timestamp with time zone,
  ADD COLUMN IF NOT EXISTS trial_end_date timestamp with time zone;

-- Update existing restaurants: set trial_end_date for those without it
UPDATE public.restaurants 
SET trial_end_date = created_at + interval '7 days',
    plan_type = 'trial',
    plan_status = CASE 
      WHEN status = 'active' THEN 'active'
      ELSE 'trial'
    END
WHERE trial_end_date IS NULL;

-- Create payment_requests table
CREATE TABLE public.payment_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id uuid NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  plan_type text NOT NULL,
  amount numeric NOT NULL,
  screenshot_url text NOT NULL,
  upi_transaction_id text,
  status text NOT NULL DEFAULT 'pending',
  admin_notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payment_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own payment requests
CREATE POLICY "Users can view own payment requests"
ON public.payment_requests
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own payment requests
CREATE POLICY "Users can create payment requests"
ON public.payment_requests
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Admins can view all payment requests
CREATE POLICY "Admins can view all payment requests"
ON public.payment_requests
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can manage all payment requests
CREATE POLICY "Admins can manage payment requests"
ON public.payment_requests
FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_payment_requests_updated_at
BEFORE UPDATE ON public.payment_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
