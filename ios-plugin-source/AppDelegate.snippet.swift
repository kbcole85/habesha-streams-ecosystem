// Add these snippets into ios/App/App/AppDelegate.swift after running
// `npx cap add ios`. The default AppDelegate Capacitor generates does NOT
// have these — you must merge them in by hand.
//
// What this enables:
//  1. Transparent WKWebView background so the native LiveStream preview view
//     (MTHKView) sitting behind it is visible. Without this you get a black
//     screen instead of the camera feed.
//  2. A way to lock the activity orientation while the user is live (mirrors
//     the Android plugin behaviour). Without this, mid-stream rotation can
//     cause the encoder to glitch.

// ──────────────────────────────────────────────────────────────────────────
// 1. WKWebView transparency — add inside application(_:didFinishLaunchingWithOptions:)
//    BEFORE the `return true`.
// ──────────────────────────────────────────────────────────────────────────

// Wait until the bridge view controller's view is loaded, then make the
// WKWebView transparent so any native views added behind it (like the
// LiveStream preview) become visible.
DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
    if let rootVC = self.window?.rootViewController as? CAPBridgeViewController {
        rootVC.view.backgroundColor = .black
        // The WebView itself
        if let webView = rootVC.bridge?.webView {
            webView.isOpaque = false
            webView.backgroundColor = .clear
            webView.scrollView.backgroundColor = .clear
        }
    }
}

// ──────────────────────────────────────────────────────────────────────────
// 2. Orientation lock — add as new properties + methods on AppDelegate.
//
// The plugin sets `LiveStreamOrientationLock.shared.locked = .portrait`
// when going live, then resets to nil when the stream ends.
// ──────────────────────────────────────────────────────────────────────────

// Add this as a top-level class above AppDelegate (or in its own file):
final class LiveStreamOrientationLock {
    static let shared = LiveStreamOrientationLock()
    var locked: UIInterfaceOrientationMask?
}

// Add this method inside AppDelegate (override of UIApplicationDelegate):
func application(_ application: UIApplication,
                 supportedInterfaceOrientationsFor window: UIWindow?) -> UIInterfaceOrientationMask {
    return LiveStreamOrientationLock.shared.locked ?? .all
}
