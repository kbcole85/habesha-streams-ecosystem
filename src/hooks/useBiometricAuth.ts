import { useState, useCallback } from "react";
import { Capacitor } from "@capacitor/core";
import { Haptics, ImpactStyle } from "@capacitor/haptics";

const SERVER_KEY = "habesha-streams";

const getPlugin = async () => {
  if (!Capacitor.isNativePlatform()) return null;
  try {
    const mod = await import("capacitor-native-biometric");
    return mod.NativeBiometric;
  } catch {
    return null;
  }
};

export type BiometricType = "fingerprint" | "face" | "iris" | "none";

export interface UseBiometricAuthReturn {
  isAvailable: boolean;
  biometricType: BiometricType;
  isChecking: boolean;
  checkAvailability: () => Promise<void>;
  saveCredentials: (email: string, password: string) => Promise<boolean>;
  getStoredCredentials: () => Promise<{ email: string; password: string } | null>;
  deleteStoredCredentials: () => Promise<void>;
  authenticate: (reason?: string) => Promise<boolean>;
}

export function useBiometricAuth(): UseBiometricAuthReturn {
  const [isAvailable, setIsAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState<BiometricType>("none");
  const [isChecking, setIsChecking] = useState(false);

  const checkAvailability = useCallback(async () => {
    setIsChecking(true);
    try {
      const plugin = await getPlugin();
      if (!plugin) { setIsAvailable(false); return; }
      const result = await plugin.isAvailable();
      setIsAvailable(result.isAvailable);
      // biometryType is a numeric enum in this plugin; map it
      const t = String(result.biometryType ?? "").toLowerCase();
      if (t.includes("face") || t === "2") setBiometricType("face");
      else if (t === "3") setBiometricType("iris");
      else if (result.isAvailable) setBiometricType("fingerprint");
      else setBiometricType("none");
    } catch {
      setIsAvailable(false);
    } finally {
      setIsChecking(false);
    }
  }, []);

  const saveCredentials = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      const plugin = await getPlugin();
      if (!plugin) return false;
      await plugin.setCredentials({ username: email, password, server: SERVER_KEY });
      return true;
    } catch {
      return false;
    }
  }, []);

  const getStoredCredentials = useCallback(async (): Promise<{ email: string; password: string } | null> => {
    try {
      const plugin = await getPlugin();
      if (!plugin) return null;
      const result = await plugin.getCredentials({ server: SERVER_KEY });
      return result ? { email: result.username, password: result.password } : null;
    } catch {
      return null;
    }
  }, []);

  const deleteStoredCredentials = useCallback(async () => {
    try {
      const plugin = await getPlugin();
      if (!plugin) return;
      await plugin.deleteCredentials({ server: SERVER_KEY });
    } catch {
      // silently ignore
    }
  }, []);

  const authenticate = useCallback(async (reason = "Verify your identity to continue"): Promise<boolean> => {
    try {
      const plugin = await getPlugin();
      if (!plugin) return false;
      await Haptics.impact({ style: ImpactStyle.Medium }).catch(() => {});
      await plugin.verifyIdentity({
        reason,
        title: "Habesha Streams",
        subtitle: "Biometric Login",
        description: reason,
        negativeButtonText: "Use Password",
      });
      await Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
      return true;
    } catch {
      // verifyIdentity rejects on failure/cancel
      return false;
    }
  }, []);

  return {
    isAvailable,
    biometricType,
    isChecking,
    checkAvailability,
    saveCredentials,
    getStoredCredentials,
    deleteStoredCredentials,
    authenticate,
  };
}
