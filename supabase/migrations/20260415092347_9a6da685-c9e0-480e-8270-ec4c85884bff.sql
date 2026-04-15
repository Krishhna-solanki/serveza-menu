
-- Notifications table for admin alerts
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all notifications"
ON public.notifications FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage notifications"
ON public.notifications FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own notifications"
ON public.notifications FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- User devices table for device-based login security
CREATE TABLE public.user_devices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  device_fingerprint TEXT NOT NULL,
  device_name TEXT,
  is_trusted BOOLEAN NOT NULL DEFAULT false,
  last_used_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, device_fingerprint)
);

ALTER TABLE public.user_devices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own devices"
ON public.user_devices FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own devices"
ON public.user_devices FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- OTP verifications table
CREATE TABLE public.otp_verifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  email TEXT NOT NULL,
  otp_code TEXT NOT NULL,
  purpose TEXT NOT NULL DEFAULT 'login',
  is_used BOOLEAN NOT NULL DEFAULT false,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.otp_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own OTPs"
ON public.otp_verifications FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Function to create admin notification on new restaurant
CREATE OR REPLACE FUNCTION public.notify_admin_new_restaurant()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_record RECORD;
BEGIN
  FOR admin_record IN SELECT user_id FROM user_roles WHERE role = 'admin'
  LOOP
    INSERT INTO notifications (user_id, type, message, metadata)
    VALUES (
      admin_record.user_id,
      'user',
      'New restaurant registered: ' || NEW.name,
      jsonb_build_object('restaurant_id', NEW.id, 'restaurant_name', NEW.name)
    );
  END LOOP;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_new_restaurant_notify
AFTER INSERT ON public.restaurants
FOR EACH ROW
EXECUTE FUNCTION public.notify_admin_new_restaurant();

-- Function to create admin notification on new payment request
CREATE OR REPLACE FUNCTION public.notify_admin_new_payment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_record RECORD;
BEGIN
  FOR admin_record IN SELECT user_id FROM user_roles WHERE role = 'admin'
  LOOP
    INSERT INTO notifications (user_id, type, message, metadata)
    VALUES (
      admin_record.user_id,
      'payment',
      'New payment request: ₹' || NEW.amount || ' for ' || NEW.plan_type || ' plan',
      jsonb_build_object('payment_id', NEW.id, 'amount', NEW.amount, 'plan_type', NEW.plan_type)
    );
  END LOOP;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_new_payment_notify
AFTER INSERT ON public.payment_requests
FOR EACH ROW
EXECUTE FUNCTION public.notify_admin_new_payment();

-- Function to notify on plan change
CREATE OR REPLACE FUNCTION public.notify_admin_plan_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_record RECORD;
BEGIN
  IF OLD.plan_type IS DISTINCT FROM NEW.plan_type OR OLD.plan_status IS DISTINCT FROM NEW.plan_status THEN
    FOR admin_record IN SELECT user_id FROM user_roles WHERE role = 'admin'
    LOOP
      INSERT INTO notifications (user_id, type, message, metadata)
      VALUES (
        admin_record.user_id,
        'plan',
        NEW.name || ' plan changed: ' || NEW.plan_type || ' (' || NEW.plan_status || ')',
        jsonb_build_object('restaurant_id', NEW.id, 'plan_type', NEW.plan_type, 'plan_status', NEW.plan_status)
      );
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_plan_change_notify
AFTER UPDATE ON public.restaurants
FOR EACH ROW
EXECUTE FUNCTION public.notify_admin_plan_change();
