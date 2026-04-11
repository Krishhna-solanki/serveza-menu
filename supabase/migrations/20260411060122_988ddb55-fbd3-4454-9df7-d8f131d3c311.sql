
-- Allow admins to manage all restaurants
CREATE POLICY "Admins can manage all restaurants"
ON public.restaurants
FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));
