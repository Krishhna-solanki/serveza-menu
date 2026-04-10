import { supabase } from "@/integrations/supabase/client";

export const uploadFile = async (file: File, path: string): Promise<string | null> => {
  const fileExt = file.name.split(".").pop();
  const fileName = `${path}/${Date.now()}.${fileExt}`;

  const { error } = await supabase.storage
    .from("restaurant-assets")
    .upload(fileName, file, { upsert: true });

  if (error) {
    console.error("Upload error:", error);
    return null;
  }

  const { data } = supabase.storage
    .from("restaurant-assets")
    .getPublicUrl(fileName);

  return data.publicUrl;
};

export const deleteFile = async (url: string) => {
  const path = url.split("/restaurant-assets/")[1];
  if (path) {
    await supabase.storage.from("restaurant-assets").remove([path]);
  }
};
