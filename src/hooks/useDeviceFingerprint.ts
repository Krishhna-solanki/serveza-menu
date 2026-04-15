import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const generateFingerprint = (): string => {
  const nav = window.navigator;
  const screen = window.screen;
  const raw = [
    nav.userAgent,
    nav.language,
    screen.width,
    screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
    nav.hardwareConcurrency || "",
  ].join("|");

  // Simple hash
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    const char = raw.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
};

const getDeviceName = (): string => {
  const ua = navigator.userAgent;
  if (/iPhone/.test(ua)) return "iPhone";
  if (/iPad/.test(ua)) return "iPad";
  if (/Android/.test(ua)) return "Android Device";
  if (/Mac/.test(ua)) return "Mac";
  if (/Windows/.test(ua)) return "Windows PC";
  if (/Linux/.test(ua)) return "Linux";
  return "Unknown Device";
};

export const useDeviceFingerprint = () => {
  const [fingerprint] = useState(() => generateFingerprint());
  const [deviceName] = useState(() => getDeviceName());

  return { fingerprint, deviceName };
};

export const useCheckDevice = (userId: string | undefined) => {
  const [isNewDevice, setIsNewDevice] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const { fingerprint, deviceName } = useDeviceFingerprint();

  useEffect(() => {
    if (!userId) return;

    const check = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("user_devices")
        .select("*")
        .eq("user_id", userId)
        .eq("device_fingerprint", fingerprint)
        .maybeSingle();

      if (error) {
        console.error("Device check error:", error);
        setIsNewDevice(false); // Default to allowing access on error
      } else {
        setIsNewDevice(!data);
      }
      setLoading(false);
    };

    check();
  }, [userId, fingerprint]);

  const trustDevice = async () => {
    if (!userId) return;
    const { error } = await supabase
      .from("user_devices")
      .upsert(
        {
          user_id: userId,
          device_fingerprint: fingerprint,
          device_name: deviceName,
          is_trusted: true,
          last_used_at: new Date().toISOString(),
        },
        { onConflict: "user_id,device_fingerprint" }
      );
    if (error) console.error("Trust device error:", error);
    setIsNewDevice(false);
  };

  const updateLastUsed = async () => {
    if (!userId) return;
    await supabase
      .from("user_devices")
      .update({ last_used_at: new Date().toISOString() } as any)
      .eq("user_id", userId)
      .eq("device_fingerprint", fingerprint);
  };

  return { isNewDevice, loading, fingerprint, deviceName, trustDevice, updateLastUsed };
};
