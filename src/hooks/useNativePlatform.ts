import { Capacitor } from "@capacitor/core";

/**
 * Returns true when running inside a Capacitor native shell (iOS / Android).
 * Returns false on the web / PWA.
 */
export function useNativePlatform() {
  const isNative = Capacitor.isNativePlatform();
  const platform = Capacitor.getPlatform(); // "ios" | "android" | "web"
  const isIOS = platform === "ios";
  const isAndroid = platform === "android";

  return { isNative, isIOS, isAndroid, platform };
}
