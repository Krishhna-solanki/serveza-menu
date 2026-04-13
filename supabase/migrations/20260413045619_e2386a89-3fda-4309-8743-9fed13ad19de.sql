ALTER TABLE public.restaurants 
ADD COLUMN show_logo boolean NOT NULL DEFAULT true,
ADD COLUMN show_banner boolean NOT NULL DEFAULT true;