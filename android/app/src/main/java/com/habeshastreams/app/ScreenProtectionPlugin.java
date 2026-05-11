package com.habeshastreams.app;

import android.database.ContentObserver;
import android.net.Uri;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.provider.MediaStore;
import android.view.WindowManager;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "ScreenProtection")
public class ScreenProtectionPlugin extends Plugin {

    private ContentObserver screenshotObserver;
    private boolean isProtectionEnabled = false;

    @PluginMethod
    public void enableProtection(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            try {
                // FLAG_SECURE prevents screenshots and screen recording
                getActivity().getWindow().setFlags(
                    WindowManager.LayoutParams.FLAG_SECURE,
                    WindowManager.LayoutParams.FLAG_SECURE
                );
                isProtectionEnabled = true;

                JSObject result = new JSObject();
                result.put("enabled", true);
                call.resolve(result);
            } catch (Exception e) {
                call.reject("Failed to enable screen protection", e);
            }
        });
    }

    @PluginMethod
    public void disableProtection(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            try {
                getActivity().getWindow().clearFlags(
                    WindowManager.LayoutParams.FLAG_SECURE
                );
                isProtectionEnabled = false;

                JSObject result = new JSObject();
                result.put("enabled", false);
                call.resolve(result);
            } catch (Exception e) {
                call.reject("Failed to disable screen protection", e);
            }
        });
    }

    @PluginMethod
    public void isProtectionEnabled(PluginCall call) {
        JSObject result = new JSObject();
        result.put("enabled", isProtectionEnabled);
        call.resolve(result);
    }

    @PluginMethod
    public void startScreenshotDetection(PluginCall call) {
        try {
            if (screenshotObserver != null) {
                call.resolve(new JSObject().put("started", true));
                return;
            }

            Handler handler = new Handler(Looper.getMainLooper());
            screenshotObserver = new ContentObserver(handler) {
                @Override
                public void onChange(boolean selfChange, Uri uri) {
                    super.onChange(selfChange, uri);
                    if (uri != null) {
                        String path = uri.toString().toLowerCase();
                        if (path.contains("screenshot") || path.contains("screen_shot")
                            || path.contains("screen-shot") || path.contains("screencapture")) {
                            // Notify JavaScript side about the screenshot
                            JSObject data = new JSObject();
                            data.put("timestamp", System.currentTimeMillis());
                            data.put("type", "screenshot");
                            notifyListeners("screenshotDetected", data);
                        }
                    }
                }
            };

            // Observe external image content changes (screenshots are saved as images)
            getContext().getContentResolver().registerContentObserver(
                MediaStore.Images.Media.EXTERNAL_CONTENT_URI,
                true,
                screenshotObserver
            );

            JSObject result = new JSObject();
            result.put("started", true);
            call.resolve(result);
        } catch (Exception e) {
            call.reject("Failed to start screenshot detection", e);
        }
    }

    @PluginMethod
    public void stopScreenshotDetection(PluginCall call) {
        try {
            if (screenshotObserver != null) {
                getContext().getContentResolver().unregisterContentObserver(screenshotObserver);
                screenshotObserver = null;
            }

            JSObject result = new JSObject();
            result.put("stopped", true);
            call.resolve(result);
        } catch (Exception e) {
            call.reject("Failed to stop screenshot detection", e);
        }
    }

    @Override
    protected void handleOnDestroy() {
        if (screenshotObserver != null) {
            getContext().getContentResolver().unregisterContentObserver(screenshotObserver);
            screenshotObserver = null;
        }
        super.handleOnDestroy();
    }
}
