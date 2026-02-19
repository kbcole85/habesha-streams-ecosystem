import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { StatusBar, Style } from "@capacitor/status-bar";
import { SplashScreen } from "@capacitor/splash-screen";

/**
 * MobileShell — mounts once at the app root.
 * Configures the native status bar style and hides the splash screen.
 * On web it's a no-op.
 */
const MobileShell = () => {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const init = async () => {
      try {
        // Dark status bar to match our cinematic dark theme
        await StatusBar.setStyle({ style: Style.Dark });
        await StatusBar.setBackgroundColor({ color: "#0a0804" });
      } catch {
        // StatusBar may not be available on all platforms
      }

      try {
        // Hide splash screen after app is ready
        await SplashScreen.hide({ fadeOutDuration: 400 });
      } catch {
        // Splash screen may already be hidden
      }
    };

    init();
  }, []);

  return null; // purely side-effect component
};

export default MobileShell;
