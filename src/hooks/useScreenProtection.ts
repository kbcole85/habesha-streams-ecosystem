import { useEffect, useCallback, useRef } from "react";
import { Capacitor } from "@capacitor/core";
import ScreenProtection from "@/plugins/ScreenProtectionPlugin";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useScreenProtection() {
  const listenerRef = useRef<{ remove: () => Promise<void> } | null>(null);
  const isNative = Capacitor.isNativePlatform();

  const enableProtection = useCallback(async () => {
    if (!isNative) return;
    try {
      await ScreenProtection.enableProtection();
    } catch (e) {
      console.warn("Screen protection not available:", e);
    }
  }, [isNative]);

  const disableProtection = useCallback(async () => {
    if (!isNative) return;
    try {
      await ScreenProtection.disableProtection();
    } catch (e) {
      console.warn("Screen protection disable failed:", e);
    }
  }, [isNative]);

  // streamId, when provided, links the audit event to a live stream so the
  // creator can receive a Realtime notification.
  const startDetection = useCallback(async (streamId?: string) => {
    if (!isNative) return;
    try {
      await ScreenProtection.startScreenshotDetection();

      const listener = await ScreenProtection.addListener(
        "screenshotDetected",
        async (data) => {
          toast.error(
            "Screenshot detected! This activity has been logged.",
            { duration: 5000 }
          );

          try {
            const {
              data: { user },
            } = await supabase.auth.getUser();
            if (user) {
              await supabase.from("audit_logs").insert({
                actor_id: user.id,
                action: "screenshot_detected",
                target_id: streamId ?? null,
                details: {
                  timestamp: data.timestamp,
                  type: data.type,
                  platform: Capacitor.getPlatform(),
                  stream_id: streamId ?? null,
                },
              });
            }
          } catch (err) {
            console.error("Failed to log screenshot event:", err);
          }
        }
      );

      listenerRef.current = listener;
    } catch (e) {
      console.warn("Screenshot detection not available:", e);
    }
  }, [isNative]);

  const stopDetection = useCallback(async () => {
    if (!isNative) return;
    try {
      if (listenerRef.current) {
        await listenerRef.current.remove();
        listenerRef.current = null;
      }
      await ScreenProtection.stopScreenshotDetection();
    } catch (e) {
      console.warn("Screenshot detection stop failed:", e);
    }
  }, [isNative]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (listenerRef.current) {
        listenerRef.current.remove();
        listenerRef.current = null;
      }
    };
  }, []);

  return {
    enableProtection,
    disableProtection,
    startDetection,
    stopDetection,
    isNative,
  };
}
