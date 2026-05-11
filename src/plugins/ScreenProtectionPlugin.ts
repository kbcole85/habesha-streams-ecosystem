import { registerPlugin } from "@capacitor/core";
import type { PluginListenerHandle } from "@capacitor/core";

export interface ScreenProtectionPlugin {
  enableProtection(): Promise<{ enabled: boolean }>;
  disableProtection(): Promise<{ enabled: boolean }>;
  isProtectionEnabled(): Promise<{ enabled: boolean }>;
  startScreenshotDetection(): Promise<{ started: boolean }>;
  stopScreenshotDetection(): Promise<{ stopped: boolean }>;
  addListener(
    eventName: "screenshotDetected",
    listenerFunc: (data: { timestamp: number; type: string }) => void
  ): Promise<PluginListenerHandle>;
}

const ScreenProtection = registerPlugin<ScreenProtectionPlugin>(
  "ScreenProtection"
);

export default ScreenProtection;
