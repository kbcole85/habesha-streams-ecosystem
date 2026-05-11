# iOS setup — step by step (for the friend with the Mac)

This document is for the person bringing this repo onto a Mac and producing an iOS build of Habesha Streams. Follow it top to bottom.

The Android version is already shipped. The iOS native live-streaming plugin (Swift, using HaishinKit for RTMP) is pre-written in this `ios-plugin-source/` folder. You do NOT need to write iOS code from scratch. You DO need to wire it into Xcode and run a few setup commands.

Estimated time end-to-end: **2–3 hours** for a developer comfortable with iOS, ~1 day for someone newer to it. Most of that is Apple Developer account paperwork.

---

## Prerequisites

Before starting, the Mac needs:

- **macOS 14 (Sonoma) or newer** — Capacitor 8 + recent Xcode require this
- **Xcode 15.4 or newer** — install from the Mac App Store (free, ~10 GB download)
- **Node.js 18+** — `node --version` to check; install from nodejs.org if missing
- **CocoaPods** — `sudo gem install cocoapods` (or `brew install cocoapods`)
- **Apple Developer account** — $99/year, sign up at https://developer.apple.com. Verification can take 1–3 business days, **start this first**.

Once those are installed, you're ready to start.

---

## Step 1 — Clone the repo and install dependencies

```bash
git clone <this-repo-url>
cd habesha-streams-ecosystem
npm install
```

Wait for `npm install` to finish (typically 1–3 minutes).

---

## Step 2 — Build the web bundle

```bash
npm run build
```

This produces a `dist/` folder. Capacitor copies this into the iOS project as the bundled web assets.

---

## Step 3 — Add the iOS platform to Capacitor

```bash
npx cap add ios
```

This creates an `ios/` folder with an Xcode project. It runs `pod install` automatically using whatever pods Capacitor needs by default.

If `pod install` fails with errors about unknown sources, run:
```bash
cd ios/App
pod repo update
cd ../..
```
and then re-run `npx cap add ios`.

---

## Step 4 — Drop the LiveStreamPlugin files into the Xcode project

The Swift plugin and Objective-C bridge are pre-written in `ios-plugin-source/`. You need to copy them into the Xcode project AND register them with Xcode so they get compiled.

### 4a. Copy the files

```bash
cp ios-plugin-source/LiveStreamPlugin.swift ios/App/App/
cp ios-plugin-source/LiveStreamPlugin.m ios/App/App/
```

### 4b. Open the workspace in Xcode

```bash
npx cap open ios
```

This opens `ios/App/App.xcworkspace` in Xcode. **Always use the .xcworkspace, never the .xcodeproj** — Capacitor uses CocoaPods which requires the workspace.

### 4c. Add the files to the Xcode target

In the Xcode left sidebar, you'll see a folder `App` under the project tree. The two files you just copied need to appear there AND be checked as members of the `App` target.

1. In Finder, drag `LiveStreamPlugin.swift` and `LiveStreamPlugin.m` from `ios/App/App/` into the Xcode `App` group in the sidebar.
2. In the dialog that pops up:
   - "Destination": leave unchecked (don't copy, the files are already there)
   - "Added folders": Create groups
   - "Add to targets": ✓ check **App**
3. Click Finish.

The first time you add a Swift file to an Objective-C app target, Xcode will prompt to **Create Bridging Header** — click **Create**. Xcode generates `App-Bridging-Header.h` and configures the project. (If it doesn't prompt, that means a bridging header already exists — fine.)

---

## Step 5 — Add HaishinKit to the Podfile

Open `ios/App/Podfile` in any text editor. Find the `target 'App' do` block. Add this line inside it (alongside the existing `pod` lines):

```ruby
pod 'HaishinKit', '~> 1.9.5'
```

Save. Then from the terminal:

```bash
cd ios/App
pod install --repo-update
cd ../..
```

This downloads HaishinKit and links it into the workspace. `--repo-update` ensures the local CocoaPods spec cache is fresh.

---

## Step 6 — Add iOS permission strings to Info.plist

In Xcode, find `App/App/Info.plist` in the sidebar. Right-click → **Open As → Source Code** (this lets you paste raw XML).

Find the top-level `<dict>` and add the contents of `ios-plugin-source/Info.plist.snippet` inside it (the file has comments explaining each entry). The required entries are:

- `NSCameraUsageDescription`
- `NSMicrophoneUsageDescription`
- `UISupportedInterfaceOrientations` (with portrait + landscape variants)

The exact strings to use are in `Info.plist.snippet`.

---

## Step 7 — Configure code signing

In Xcode, click the project name (top of the sidebar) → select the **App** target → **Signing & Capabilities** tab.

1. **Team**: select your Apple Developer team from the dropdown. If you don't see one, sign in via Xcode → Settings → Accounts → +.
2. **Bundle Identifier**: change to `com.habeshastreams.app` (matches Android applicationId).
3. **Automatically manage signing**: leave checked. Xcode will create a provisioning profile for you.

If Xcode complains about the bundle identifier being unavailable, change it to `com.habeshastreams.app.ios` or similar. The bundle ID must be unique across the App Store.

---

## Step 8 — Build and run on a real device (recommended over simulator)

The iOS Simulator can't access the camera, so you'll see a blank preview. Use a physical iPhone to actually test the live streaming.

1. Plug an iPhone into the Mac via USB.
2. Trust the computer when iOS prompts.
3. In Xcode, select your iPhone from the device dropdown (top-left, next to the Run button).
4. Click the **Run** button (▶) or press `Cmd+R`.
5. The first time, iOS will refuse to launch with "Untrusted Developer" — go to **Settings → General → VPN & Device Management** on the iPhone, tap your developer profile, tap **Trust**.
6. Re-launch from Xcode. App should open.

### What to test

- Open the app, sign in
- Become a creator (Account → Profile)
- Tap **Go Live** in the bottom nav
- Grant camera + microphone permissions when prompted
- Verify the camera preview fills the screen, not letterboxed, person upright
- Tap **Go Live** to start streaming
- From another device, watch the stream (Mux dashboard or browser at the playback URL)
- Confirm: viewer sees portrait video, un-mirrored, correct orientation
- Switch to landscape, repeat
- Switch front/back camera mid-preview
- End stream, confirm cleanup

---

## Step 9 — Build for App Store Connect

Once everything works on a real device:

1. In Xcode, select **Any iOS Device (arm64)** in the device dropdown (not your physical phone).
2. **Product → Archive**.
3. Wait for the archive to complete (~5 minutes).
4. The Organizer window opens — select your archive, click **Distribute App**.
5. Choose **App Store Connect** → **Upload**.
6. Sign with your Apple Developer credentials.
7. Wait for the upload + processing (~15 minutes).

The build will appear in App Store Connect under TestFlight → Builds. From there you can:
- Add testers and try it via TestFlight (similar to Play Console internal testing)
- Submit for App Store review when ready

---

## Common problems and fixes

**"No such module 'HaishinKit'"** when building Swift
→ `pod install` didn't run or the `App.xcworkspace` wasn't opened (you opened `.xcodeproj` by mistake). Close everything, run `pod install` from `ios/App/`, open `App.xcworkspace`.

**"App-Bridging-Header.h not found"**
→ Xcode didn't auto-create the bridging header. Build Settings → search for "Objective-C Bridging Header" → set it to `App/App-Bridging-Header.h`. Create the file if missing with `#import <Capacitor/Capacitor.h>` inside.

**Black screen instead of camera preview**
→ The WKWebView isn't transparent. Add this to `AppDelegate.swift`'s `application(_:didFinishLaunchingWithOptions:)` BEFORE returning true: see `ios-plugin-source/AppDelegate.snippet.swift`.

**Upload fails with "Missing Push Notification Entitlement"**
→ Capacitor includes push notification capability by default. Either add the capability in Signing & Capabilities (requires Apple Developer Push setup) or remove it: in Xcode, App target → Signing & Capabilities → click the trash icon next to Push Notifications.

**Stream connects but viewers see nothing**
→ Check the RTMP URL/key are reaching HaishinKit unchanged. The Android plugin uses `rtmp://global-live.mux.com:5222/app` — same URL works on iOS. If using Mux, confirm your account is on a paid tier (free Mux can't stream live).

---

## File map

| Source file (in this Windows repo) | Goes to (on the Mac, after cap add ios) |
|---|---|
| `ios-plugin-source/LiveStreamPlugin.swift` | `ios/App/App/LiveStreamPlugin.swift` |
| `ios-plugin-source/LiveStreamPlugin.m` | `ios/App/App/LiveStreamPlugin.m` |
| `ios-plugin-source/Podfile.snippet` | Append to `ios/App/Podfile` (target 'App' do block) |
| `ios-plugin-source/Info.plist.snippet` | Merge into `ios/App/App/Info.plist` |
| `ios-plugin-source/AppDelegate.snippet.swift` | Merge into `ios/App/App/AppDelegate.swift` |

---

## What this plugin does (so the Mac developer knows what they're working with)

The Swift plugin mirrors the Android Java plugin's API exactly:

- `requestPermissions()` — asks for camera + microphone
- `startPreview()` — sets up RTMPConnection, RTMPStream, MTHKView, attaches camera + mic, makes WebView transparent so preview shows behind it
- `startStreaming({rtmpUrl, streamKey})` — connects to RTMP server, publishes
- `stopStreaming()` — closes connection, removes preview, restores WebView
- `switchCamera()` — toggles front/back
- `toggleMute()` — mutes/unmutes mic
- `getStatus()` — returns current state
- Event listeners: `streamStatus` (connected/disconnected/failed), `bitrateUpdate`

The JS side (`src/plugins/LiveStreamPlugin.ts` + `src/pages/GoLive.tsx`) is identical for both platforms — Capacitor routes the calls to whichever native plugin is registered.

If you (Mac developer) hit issues, the Android equivalent at `android/app/src/main/java/com/habeshastreams/app/LiveStreamPlugin.java` is fully working and shows the intended behaviour for each method.
