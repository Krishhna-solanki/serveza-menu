
-- 1. Public-safe view for restaurants
CREATE OR REPLACE VIEW public.public_restaurants
WITH (security_invoker = true)
AS
SELECT id, name, slug, logo_url, cover_url, show_logo, show_banner
FROM public.restaurants;

GRANT SELECT ON public.public_restaurants TO anon, authenticated;

-- 2. Remove broad public SELECT on restaurants; keep owner + admin access
DROP POLICY IF EXISTS "Anyone can view restaurants" ON public.restaurants;

-- 3. Tighten storage policies on restaurant-assets bucket
DROP POLICY IF EXISTS "Anyone can view restaurant assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete their assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update their assets" ON storage.objects;

CREATE POLICY "Owners can update their restaurant assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'restaurant-assets'
  AND EXISTS (
    SELECT 1 FROM public.restaurants r
    WHERE r.user_id = auth.uid()
      AND r.id::text = (storage.foldername(name))[1]
  )
)
WITH CHECK (
  bucket_id = 'restaurant-assets'
  AND EXISTS (
    SELECT 1 FROM public.restaurants r
    WHERE r.user_id = auth.uid()
      AND r.id::text = (storage.foldername(name))[1]
  )
);

CREATE POLICY "Owners can delete their restaurant assets"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'restaurant-assets'
  AND EXISTS (
    SELECT 1 FROM public.restaurants r
    WHERE r.user_id = auth.uid()
      AND r.id::text = (storage.foldername(name))[1]
  )
);
