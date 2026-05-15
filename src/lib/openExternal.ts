import { Capacitor } from "@capacitor/core";
import { Browser } from "@capacitor/browser";

/**
 * Open a URL in the OS browser.
 *
 * On Capacitor (iOS/Android) this uses Safari View Controller (iOS) or
 * Chrome Custom Tabs (Android) — both are accepted by App Store / Play Store
 * review for external billing flows under their "Reader app" / "External
 * offers" programmes.
 *
 * Falls back to `window.open` on the web where a normal new-tab is what
 * users expect.
 *
 * Use this anywhere we'd previously have called
 * `window.open(url, "_blank")` for Stripe Checkout, customer portal, or
 * any external link — `window.open` inside Capacitor opens the link in
 * the embedded WKWebView, which Apple rejects at App Store review.
 */
export async function openExternal(url: string): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    await Browser.open({ url });
  } else {
    window.open(url, "_blank");
  }
}
