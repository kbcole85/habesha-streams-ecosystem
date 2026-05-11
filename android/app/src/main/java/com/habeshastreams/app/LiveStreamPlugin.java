package com.habeshastreams.app;

import android.Manifest;
import android.content.pm.ActivityInfo;
import android.graphics.Color;
import android.util.Log;
import android.view.Surface;
import android.view.SurfaceHolder;
import android.view.View;
import android.view.ViewGroup;
import android.widget.FrameLayout;

import com.pedro.encoder.input.video.CameraHelper;
import com.pedro.encoder.utils.gl.AspectRatioMode;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import com.pedro.common.ConnectChecker;
import com.pedro.library.rtmp.RtmpCamera2;
import com.pedro.library.view.OpenGlView;

@CapacitorPlugin(
    name = "LiveStream",
    permissions = {
        @Permission(strings = {Manifest.permission.CAMERA}, alias = "camera"),
        @Permission(strings = {Manifest.permission.RECORD_AUDIO}, alias = "microphone")
    }
)
public class LiveStreamPlugin extends Plugin implements ConnectChecker {

    private static final String TAG = "LiveStreamPlugin";

    private volatile RtmpCamera2 rtmpCamera;
    private volatile OpenGlView openGlView;
    private volatile boolean isStreaming = false;
    private volatile boolean isFrontCamera = true;
    private volatile boolean isMuted = false;
    // True only while we have the activity orientation pinned. We pin at
    // startStream (not startPreview) so the user can rotate freely up until
    // they tap "Go Live"; the encoder uses whatever orientation they chose
    // and we lock it for the duration of the stream.
    private volatile boolean orientationLocked = false;

    // ── ConnectChecker ────────────────────────────────────────────────────────

    @Override public void onConnectionStarted(String url) {}

    @Override
    public void onConnectionSuccess() {
        isStreaming = true;
        JSObject data = new JSObject();
        data.put("status", "connected");
        notifyListeners("streamStatus", data);
    }

    @Override
    public void onConnectionFailed(String reason) {
        isStreaming = false;
        JSObject data = new JSObject();
        data.put("status", "failed");
        data.put("reason", reason != null ? reason : "Unknown error");
        notifyListeners("streamStatus", data);
    }

    @Override
    public void onNewBitrate(long bitrate) {
        JSObject data = new JSObject();
        data.put("bitrate", bitrate);
        notifyListeners("bitrateUpdate", data);
    }

    @Override
    public void onDisconnect() {
        isStreaming = false;
        JSObject data = new JSObject();
        data.put("status", "disconnected");
        notifyListeners("streamStatus", data);
    }

    @Override
    public void onAuthError() {
        JSObject data = new JSObject();
        data.put("status", "authError");
        data.put("reason", "Authentication failed");
        notifyListeners("streamStatus", data);
    }

    @Override public void onAuthSuccess() {}

    // ── Plugin Methods ────────────────────────────────────────────────────────

    @PluginMethod
    public void startPreview(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            try {
                // Do NOT lock orientation here — let the user rotate the device
                // freely between tapping "Start" and tapping "Go Live". The
                // activity is pinned in startStreaming() to whatever orientation
                // they're holding at that moment.

                getBridge().getWebView().setBackgroundColor(Color.TRANSPARENT);
                getBridge().getWebView().setLayerType(View.LAYER_TYPE_SOFTWARE, null);

                ViewGroup rootView = getActivity().findViewById(android.R.id.content);

                // Remove any existing view first
                if (openGlView != null) {
                    rootView.removeView(openGlView);
                    openGlView = null;
                }

                openGlView = new OpenGlView(getContext());
                // Fill mode = edge-to-edge preview like TikTok / IG Live. The
                // camera frame gets cropped on its long edge to fit the surface.
                // Default (Adjust) letterboxes 16:9 into a portrait viewport.
                openGlView.setAspectRatioMode(AspectRatioMode.Fill);
                // CRITICAL: do NOT call openGlView.setRotation() or
                // setStreamRotation() here. RtmpCamera2 calls them internally
                // when prepareVideo() runs, derived from the rotation arg you
                // pass. Manually calling them stacks rotations.

                FrameLayout.LayoutParams params = new FrameLayout.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    ViewGroup.LayoutParams.MATCH_PARENT
                );
                rootView.addView(openGlView, 0, params);

                rtmpCamera = new RtmpCamera2(openGlView, this);
                // Front camera selfie pattern: preview stays mirrored (users
                // expect their selfie to mirror their movements), but the
                // encoded stream is un-mirrored so viewers see text and faces
                // the right way around.
                applyFrontCameraFlip();

                // pedroSG94's official examples start the preview in
                // surfaceChanged(), not surfaceCreated(). surfaceChanged fires
                // after the surface exists, has real dimensions, AND the
                // library's own internal callback (added in OpenGlView's
                // constructor before ours) has already run and set up its GL
                // render thread + SurfaceTexture. The retry loop guards against
                // any remaining race where the GL thread is still finishing.
                openGlView.getHolder().addCallback(new SurfaceHolder.Callback() {
                    private boolean started = false;
                    @Override
                    public void surfaceCreated(SurfaceHolder holder) {}
                    @Override
                    public void surfaceChanged(SurfaceHolder h, int fmt, int w, int hh) {
                        if (started) return;
                        started = true;
                        OpenGlView v = openGlView;
                        if (v != null) v.post(() -> waitForGlReadyAndStartPreview(call, 30));
                    }
                    @Override
                    public void surfaceDestroyed(SurfaceHolder holder) {}
                });

            } catch (Exception e) {
                Log.e(TAG, "startPreview error", e);
                call.reject("Failed to start preview: " + e.getMessage());
            }
        });
    }

    // Retries startPreview() every 100 ms (max 20 × 100 ms = 2 s).
    // The library's GL render thread creates its SurfaceTexture asynchronously
    // after surfaceCreated; if it isn't ready yet, startPreview() throws a
    // NullPointerException. We catch that specifically and retry until the
    // GL thread finishes, then resolve — or reject if it never becomes ready.
    private void waitForGlReadyAndStartPreview(PluginCall call, int retriesLeft) {
        OpenGlView view = openGlView;
        RtmpCamera2 cam = rtmpCamera;
        if (view == null || cam == null) {
            call.reject("Camera resources were released");
            return;
        }
        try {
            cam.startPreview(
                isFrontCamera
                    ? com.pedro.encoder.input.video.CameraHelper.Facing.FRONT
                    : com.pedro.encoder.input.video.CameraHelper.Facing.BACK
            );
            JSObject result = new JSObject();
            result.put("success", true);
            call.resolve(result);
        } catch (Exception e) {
            // Kotlin's Intrinsics.checkExpressionValueIsNotNull throws
            // IllegalStateException with the literal message
            // "getSurfaceTexture(...) must not be null" when the GL render
            // thread hasn't created its SurfaceTexture yet. Retry on any
            // exception whose message indicates this race; otherwise reject.
            String msg = e.getMessage();
            boolean isSurfaceNotReady = msg != null && msg.contains("must not be null");
            if (isSurfaceNotReady && retriesLeft > 0) {
                view.postDelayed(() -> waitForGlReadyAndStartPreview(call, retriesLeft - 1), 100);
            } else {
                Log.e(TAG, "startPreview failed", e);
                call.reject("Failed to start preview: " + (msg != null ? msg : e.getClass().getSimpleName()));
            }
        }
    }

    @PluginMethod
    public void startStreaming(PluginCall call) {
        String rtmpUrl = call.getString("rtmpUrl");
        String streamKey = call.getString("streamKey");

        if (rtmpUrl == null || rtmpUrl.isEmpty()) {
            call.reject("rtmpUrl is required");
            return;
        }
        if (streamKey == null || streamKey.isEmpty()) {
            call.reject("streamKey is required");
            return;
        }

        RtmpCamera2 cam = rtmpCamera;
        if (cam == null) {
            call.reject("Call startPreview first");
            return;
        }

        getActivity().runOnUiThread(() -> {
            try {
                String fullUrl = rtmpUrl + "/" + streamKey;

                boolean audioOk = cam.prepareAudio(128 * 1024, 44100, true);
                if (!audioOk) {
                    call.reject("Failed to prepare audio encoder");
                    return;
                }

                // Pin activity orientation NOW (not in startPreview) so the
                // user could rotate freely while previewing but the stream
                // can't double-rotate mid-broadcast.
                lockActivityOrientation();

                // Canonical pedroSG94 pattern: ALWAYS pass landscape-native
                // dimensions (width = larger, height = smaller). The library
                // swaps W/H internally when rotation is 90 or 270. So
                // prepareVideo(1280, 720, ..., 90) produces a 720x1280 portrait
                // stream; rotation=0 produces a 1280x720 landscape stream.
                // CameraHelper.getCameraOrientation returns 90 for portrait
                // device, 0 for landscape — exactly what prepareVideo wants.
                int rotation = CameraHelper.getCameraOrientation(getActivity());
                boolean videoOk = cam.prepareVideo(1280, 720, 30, 2500 * 1024, 2, rotation);
                if (!videoOk) {
                    call.reject("Failed to prepare video encoder");
                    return;
                }

                cam.startStream(fullUrl);
                isStreaming = true;

                JSObject result = new JSObject();
                result.put("success", true);
                call.resolve(result);
            } catch (Exception e) {
                Log.e(TAG, "startStreaming error", e);
                call.reject("Streaming failed: " + e.getMessage());
            }
        });
    }

    /**
     * Pins the activity to its current physical orientation so it doesn't
     * recreate or rotate mid-stream. Reads the current display rotation and
     * picks PORTRAIT / LANDSCAPE / REVERSE_PORTRAIT / REVERSE_LANDSCAPE.
     * Mirrors pedroSG94's official ScreenOrientation.lockScreen helper.
     */
    private void lockActivityOrientation() {
        try {
            int rot = getActivity().getWindowManager().getDefaultDisplay().getRotation();
            int requested;
            switch (rot) {
                case Surface.ROTATION_0:
                    requested = ActivityInfo.SCREEN_ORIENTATION_PORTRAIT; break;
                case Surface.ROTATION_90:
                    requested = ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE; break;
                case Surface.ROTATION_180:
                    requested = ActivityInfo.SCREEN_ORIENTATION_REVERSE_PORTRAIT; break;
                case Surface.ROTATION_270:
                    requested = ActivityInfo.SCREEN_ORIENTATION_REVERSE_LANDSCAPE; break;
                default:
                    requested = ActivityInfo.SCREEN_ORIENTATION_LOCKED;
            }
            getActivity().setRequestedOrientation(requested);
            orientationLocked = true;
        } catch (Exception e) {
            Log.e(TAG, "lockActivityOrientation error", e);
        }
    }

    /**
     * Front-camera selfie convention: preview stays mirrored (users expect
     * their reflection to follow them like a mirror), but the encoded stream
     * is un-mirrored so viewers see text and gestures the correct way around.
     * Back camera: nothing flipped on either path.
     */
    private void applyFrontCameraFlip() {
        OpenGlView v = openGlView;
        if (v == null) return;
        try {
            v.setIsPreviewHorizontalFlip(false);
            v.setIsPreviewVerticalFlip(false);
            v.setIsStreamHorizontalFlip(isFrontCamera);
            v.setIsStreamVerticalFlip(false);
        } catch (Exception e) {
            Log.e(TAG, "applyFrontCameraFlip error", e);
        }
    }

    @PluginMethod
    public void stopStreaming(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            try {
                cleanup();
                JSObject result = new JSObject();
                result.put("success", true);
                call.resolve(result);
            } catch (Exception e) {
                Log.e(TAG, "stopStreaming error", e);
                call.reject("Stop failed: " + e.getMessage());
            }
        });
    }

    @PluginMethod
    public void switchCamera(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            try {
                RtmpCamera2 cam = rtmpCamera;
                if (cam != null) cam.switchCamera();
                isFrontCamera = !isFrontCamera;
                // Re-apply the selfie-mirror convention: stream is un-mirrored
                // when on the front camera, mirrored (default) on the back.
                applyFrontCameraFlip();
                JSObject result = new JSObject();
                result.put("front", isFrontCamera);
                call.resolve(result);
            } catch (Exception e) {
                call.reject("Switch camera failed: " + e.getMessage());
            }
        });
    }

    @PluginMethod
    public void toggleMute(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            try {
                RtmpCamera2 cam = rtmpCamera;
                if (cam != null) {
                    if (isMuted) cam.enableAudio();
                    else cam.disableAudio();
                    isMuted = !isMuted;
                }
                JSObject result = new JSObject();
                result.put("muted", isMuted);
                call.resolve(result);
            } catch (Exception e) {
                call.reject("Toggle mute failed: " + e.getMessage());
            }
        });
    }

    @PluginMethod
    public void getStatus(PluginCall call) {
        JSObject result = new JSObject();
        result.put("streaming", isStreaming);
        result.put("frontCamera", isFrontCamera);
        result.put("muted", isMuted);
        call.resolve(result);
    }

    @PluginMethod
    public void requestPermissions(PluginCall call) {
        requestPermissionForAliases(new String[]{"camera", "microphone"}, call, "permissionsCallback");
    }

    @PermissionCallback
    private void permissionsCallback(PluginCall call) {
        JSObject result = new JSObject();
        result.put("camera", getPermissionState("camera").toString());
        result.put("microphone", getPermissionState("microphone").toString());
        call.resolve(result);
    }

    // ── Lifecycle ─────────────────────────────────────────────────────────────

    @Override
    protected void handleOnDestroy() {
        cleanup();
        super.handleOnDestroy();
    }

    private void cleanup() {
        RtmpCamera2 cam = rtmpCamera;
        rtmpCamera = null;
        if (cam != null) {
            try {
                if (cam.isStreaming()) cam.stopStream();
                cam.stopPreview();
            } catch (Exception e) {
                Log.e(TAG, "cleanup camera error", e);
            }
        }

        OpenGlView view = openGlView;
        openGlView = null;
        if (view != null) {
            try {
                ViewGroup rootView = getActivity().findViewById(android.R.id.content);
                rootView.removeView(view);
            } catch (Exception e) {
                Log.e(TAG, "cleanup view error", e);
            }
        }

        try {
            getBridge().getWebView().setBackgroundColor(Color.BLACK);
            getBridge().getWebView().setLayerType(View.LAYER_TYPE_HARDWARE, null);
        } catch (Exception e) {
            Log.e(TAG, "restore webview background error", e);
        }

        if (orientationLocked) {
            try {
                getActivity().setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED);
            } catch (Exception e) {
                Log.e(TAG, "restore activity orientation error", e);
            }
            orientationLocked = false;
        }

        isStreaming = false;
    }
}
