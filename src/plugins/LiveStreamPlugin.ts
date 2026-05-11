import { registerPlugin } from "@capacitor/core";
import type { PluginListenerHandle } from "@capacitor/core";

export interface LiveStreamPlugin {
  requestPermissions(): Promise<{ camera: string; microphone: string }>;
  startPreview(): Promise<{ success: boolean }>;
  startStreaming(options: { rtmpUrl: string; streamKey: string }): Promise<{ success: boolean }>;
  stopStreaming(): Promise<{ success: boolean }>;
  switchCamera(): Promise<{ front: boolean }>;
  toggleMute(): Promise<{ muted: boolean }>;
  getStatus(): Promise<{ streaming: boolean; frontCamera: boolean; muted: boolean }>;
  addListener(eventName: "streamStatus", listenerFunc: (data: { status: string; reason?: string }) => void): Promise<PluginListenerHandle>;
  addListener(eventName: "bitrateUpdate", listenerFunc: (data: { bitrate: number }) => void): Promise<PluginListenerHandle>;
}

const LiveStream = registerPlugin<LiveStreamPlugin>("LiveStream");

export default LiveStream;
