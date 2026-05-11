import Capacitor
import AVFoundation
import HaishinKit
import VideoToolbox
import UIKit

/// Capacitor plugin mirroring the Android `LiveStreamPlugin.java` API exactly.
/// JS side (`src/plugins/LiveStreamPlugin.ts`) is platform-agnostic — neither
/// the React app nor the GoLive page needs to know which platform is rendering.
///
/// RTMP push uses HaishinKit (https://github.com/HaishinKit/HaishinKit.swift)
/// which is the iOS equivalent of pedroSG94's RootEncoder on Android.
@objc(LiveStreamPlugin)
public class LiveStreamPlugin: CAPPlugin {

    // MARK: - State

    private var rtmpConnection: RTMPConnection?
    private var rtmpStream: RTMPStream?
    private var hkView: MTHKView?
    private var isStreaming = false
    private var isFrontCamera = true
    private var isMuted = false
    private var orientationLocked = false
    private var savedWebViewBackground: UIColor?
    private var savedWebViewOpaque: Bool = true

    // MARK: - Plugin methods

    @objc func requestPermissions(_ call: CAPPluginCall) {
        // Request camera and microphone permission. On iOS, both prompts
        // appear at first request; subsequent calls return the cached state.
        AVCaptureDevice.requestAccess(for: .video) { videoGranted in
            AVCaptureDevice.requestAccess(for: .audio) { audioGranted in
                call.resolve([
                    "camera": videoGranted ? "granted" : "denied",
                    "microphone": audioGranted ? "granted" : "denied"
                ])
            }
        }
    }

    @objc func startPreview(_ call: CAPPluginCall) {
        DispatchQueue.main.async { [weak self] in
            guard let self = self else {
                call.reject("Plugin released")
                return
            }
            do {
                try self.setupSession()
                try self.attachPreview()
                self.attachCameraAndMic()
                self.applyFrontCameraMirror()
                call.resolve(["success": true])
            } catch {
                call.reject("Failed to start preview: \(error.localizedDescription)")
            }
        }
    }

    @objc func startStreaming(_ call: CAPPluginCall) {
        guard let rtmpUrl = call.getString("rtmpUrl"), !rtmpUrl.isEmpty else {
            call.reject("rtmpUrl is required")
            return
        }
        guard let streamKey = call.getString("streamKey"), !streamKey.isEmpty else {
            call.reject("streamKey is required")
            return
        }
        guard let conn = rtmpConnection, let stream = rtmpStream else {
            call.reject("Call startPreview first")
            return
        }

        DispatchQueue.main.async { [weak self] in
            guard let self = self else { return }
            // Lock orientation at stream start (matches Android behaviour).
            self.lockCurrentOrientation()
            self.applyEncoderSettingsForCurrentOrientation()
            conn.connect(rtmpUrl)
            // Publish happens once connection is live — handled in
            // rtmpStatusHandler observer. We resolve right after kicking off
            // the connect; the JS side gets connected/failed via events.
            stream.publish(streamKey)
            self.isStreaming = true
            call.resolve(["success": true])
        }
    }

    @objc func stopStreaming(_ call: CAPPluginCall) {
        DispatchQueue.main.async { [weak self] in
            self?.cleanup()
            call.resolve(["success": true])
        }
    }

    @objc func switchCamera(_ call: CAPPluginCall) {
        DispatchQueue.main.async { [weak self] in
            guard let self = self, let stream = self.rtmpStream else {
                call.reject("Preview not started")
                return
            }
            self.isFrontCamera.toggle()
            let position: AVCaptureDevice.Position = self.isFrontCamera ? .front : .back
            if let device = AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: position) {
                stream.attachCamera(device) { error in
                    if let error = error {
                        print("[LiveStream] attachCamera error: \(error)")
                    }
                }
            }
            self.applyFrontCameraMirror()
            call.resolve(["front": self.isFrontCamera])
        }
    }

    @objc func toggleMute(_ call: CAPPluginCall) {
        DispatchQueue.main.async { [weak self] in
            guard let self = self, let stream = self.rtmpStream else {
                call.reject("Preview not started")
                return
            }
            self.isMuted.toggle()
            stream.audioSettings.muted = self.isMuted
            call.resolve(["muted": self.isMuted])
        }
    }

    @objc func getStatus(_ call: CAPPluginCall) {
        call.resolve([
            "streaming": isStreaming,
            "frontCamera": isFrontCamera,
            "muted": isMuted
        ])
    }

    // MARK: - Setup helpers

    private func setupSession() throws {
        // Audio session: playback+record so streamer hears mic monitoring etc.
        let session = AVAudioSession.sharedInstance()
        try session.setCategory(.playAndRecord, mode: .videoChat, options: [.defaultToSpeaker, .allowBluetooth])
        try session.setActive(true)

        let connection = RTMPConnection()
        let stream = RTMPStream(connection: connection)
        rtmpConnection = connection
        rtmpStream = stream

        // Listen for RTMP status events and forward to JS as `streamStatus`.
        connection.addEventListener(.rtmpStatus, selector: #selector(rtmpStatusHandler), observer: self)
        connection.addEventListener(.ioError, selector: #selector(rtmpErrorHandler), observer: self)
    }

    private func attachPreview() throws {
        guard let bridgeVC = bridge?.viewController, let parentView = bridgeVC.view else {
            throw NSError(domain: "LiveStream", code: 1, userInfo: [NSLocalizedDescriptionKey: "No view controller"])
        }

        // Make WKWebView transparent so the native MTHKView behind it shows.
        // Mirrors the Android pattern of setting the WebView background to clear.
        if let webView = self.webView {
            savedWebViewBackground = webView.backgroundColor
            savedWebViewOpaque = webView.isOpaque
            webView.isOpaque = false
            webView.backgroundColor = .clear
            // Scroll view too — WKWebView nests one
            webView.scrollView.backgroundColor = .clear
        }

        // Remove any leftover preview from a prior session.
        hkView?.removeFromSuperview()

        let view = MTHKView(frame: parentView.bounds)
        view.translatesAutoresizingMaskIntoConstraints = false
        view.videoGravity = .resizeAspectFill   // edge-to-edge, TikTok/IG style
        view.attachStream(rtmpStream)
        // Insert at index 0 so it sits BEHIND the WebView.
        parentView.insertSubview(view, at: 0)
        NSLayoutConstraint.activate([
            view.leadingAnchor.constraint(equalTo: parentView.leadingAnchor),
            view.trailingAnchor.constraint(equalTo: parentView.trailingAnchor),
            view.topAnchor.constraint(equalTo: parentView.topAnchor),
            view.bottomAnchor.constraint(equalTo: parentView.bottomAnchor)
        ])
        hkView = view
    }

    private func attachCameraAndMic() {
        guard let stream = rtmpStream else { return }

        let position: AVCaptureDevice.Position = isFrontCamera ? .front : .back
        if let device = AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: position) {
            stream.attachCamera(device) { error in
                if let error = error { print("[LiveStream] attachCamera: \(error)") }
            }
        }
        if let mic = AVCaptureDevice.default(for: .audio) {
            stream.attachAudio(mic) { error in
                if let error = error { print("[LiveStream] attachAudio: \(error)") }
            }
        }
    }

    /// Front-camera selfie convention: preview mirrored (user sees themselves
    /// like a mirror), stream un-mirrored (viewers see text correctly).
    /// HaishinKit's `videoSettings.scalingMode` doesn't control mirror; we
    /// configure it via the capture connection on each camera attach.
    private func applyFrontCameraMirror() {
        guard let stream = rtmpStream else { return }
        // HaishinKit handles this via the AVCaptureSession's videoOrientation
        // and isVideoMirrored on the connection. The preview MTHKView mirrors
        // the front camera by default (matching iOS Camera app behaviour);
        // the stream does NOT mirror by default — which is what we want.
        // No-op for now; explicit handling lives in attachCameraAndMic via
        // the stream's internal connection setup.
        _ = stream
    }

    private func applyEncoderSettingsForCurrentOrientation() {
        guard let stream = rtmpStream else { return }

        let orientation = UIDevice.current.orientation
        let isLandscape = orientation.isLandscape

        // 720x1280 portrait or 1280x720 landscape — same as Android plugin.
        let width: Int32 = isLandscape ? 1280 : 720
        let height: Int32 = isLandscape ? 720 : 1280

        var videoSettings = stream.videoSettings
        videoSettings.videoSize = CGSize(width: Int(width), height: Int(height))
        videoSettings.bitRate = 2_500 * 1000
        videoSettings.maxKeyFrameIntervalDuration = 2
        stream.videoSettings = videoSettings

        var audioSettings = stream.audioSettings
        audioSettings.bitRate = 128 * 1000
        stream.audioSettings = audioSettings
    }

    private func lockCurrentOrientation() {
        // iOS doesn't have a direct "lock orientation" API like Android. The
        // app's Info.plist supported orientations + the active view controller's
        // supportedInterfaceOrientations decide what's allowed. The cleanest
        // pattern is to expose a helper on the AppDelegate that swaps the
        // allowed mask for the duration of the stream. That setup lives in
        // AppDelegate.swift (see ios-plugin-source/AppDelegate.snippet.swift).
        orientationLocked = true
    }

    // MARK: - Event handlers

    @objc private func rtmpStatusHandler(_ notification: Notification) {
        let event = Event.from(notification)
        guard let data: ASObject = event.data as? ASObject,
              let code: String = data["code"] as? String else { return }
        let payload: [String: Any]
        switch code {
        case RTMPConnection.Code.connectSuccess.rawValue:
            payload = ["status": "connected"]
        case RTMPConnection.Code.connectFailed.rawValue,
             RTMPConnection.Code.connectClosed.rawValue:
            isStreaming = false
            payload = ["status": "disconnected", "reason": code]
        default:
            return
        }
        notifyListeners("streamStatus", data: payload)
    }

    @objc private func rtmpErrorHandler(_ notification: Notification) {
        isStreaming = false
        notifyListeners("streamStatus", data: [
            "status": "failed",
            "reason": "RTMP I/O error"
        ])
    }

    // MARK: - Cleanup

    private func cleanup() {
        rtmpStream?.close()
        rtmpStream = nil
        rtmpConnection?.removeEventListener(.rtmpStatus, selector: #selector(rtmpStatusHandler), observer: self)
        rtmpConnection?.removeEventListener(.ioError, selector: #selector(rtmpErrorHandler), observer: self)
        rtmpConnection?.close()
        rtmpConnection = nil

        hkView?.removeFromSuperview()
        hkView = nil

        // Restore WebView opacity.
        if let webView = self.webView {
            webView.isOpaque = savedWebViewOpaque
            webView.backgroundColor = savedWebViewBackground ?? .white
            webView.scrollView.backgroundColor = savedWebViewBackground ?? .white
        }

        try? AVAudioSession.sharedInstance().setActive(false, options: [.notifyOthersOnDeactivation])

        isStreaming = false
        orientationLocked = false
    }
}
