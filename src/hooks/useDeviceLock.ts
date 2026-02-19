import { useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getDeviceFingerprint, getDeviceName } from "@/lib/deviceFingerprint";

type DeviceLockResult =
  | { status: "ok" | "registered" }
  | { status: "blocked"; reason: string }
  | { status: "error"; reason: string };

/**
 * Validates the current device against the registered device for the logged-in user.
 * On first login the device is automatically registered.
 * On subsequent logins, if a fingerprint mismatch is detected, returns "blocked".
 */
export function useDeviceLock() {
  const lastCheckRef = useRef<number>(0);

  const validateDevice = useCallback(async (): Promise<DeviceLockResult> => {
    // Throttle: don't re-check more than once every 30 seconds
    const now = Date.now();
    if (now - lastCheckRef.current < 30_000) {
      return { status: "ok" };
    }
    lastCheckRef.current = now;

    try {
      const fingerprint = await getDeviceFingerprint();
      const deviceName = getDeviceName();

      const { data, error } = await supabase.functions.invoke("device-validate", {
        body: {
          action: "validate",
          deviceFingerprint: fingerprint,
          deviceName,
        },
      });

      if (error) return { status: "error", reason: error.message };
      if (data?.status === "blocked") return { status: "blocked", reason: data.reason };
      return { status: data?.status ?? "ok" };
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Device check failed";
      return { status: "error", reason: msg };
    }
  }, []);

  /**
   * Called on first login to register the device.
   */
  const registerDevice = useCallback(async (): Promise<void> => {
    try {
      const fingerprint = await getDeviceFingerprint();
      const deviceName = getDeviceName();
      await supabase.functions.invoke("device-validate", {
        body: {
          action: "register",
          deviceFingerprint: fingerprint,
          deviceName,
        },
      });
    } catch {
      // Non-blocking — log silently
      console.warn("[DeviceLock] Failed to register device");
    }
  }, []);

  /**
   * Admin-only: reset a target user's device so they can log in from a new one.
   */
  const adminResetDevice = useCallback(async (targetUserId: string): Promise<void> => {
    await supabase.functions.invoke("device-validate", {
      body: { action: "reset", targetUserId },
    });
  }, []);

  return { validateDevice, registerDevice, adminResetDevice };
}
