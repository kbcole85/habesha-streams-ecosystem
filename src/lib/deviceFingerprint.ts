/**
 * Device Fingerprint Utility
 * Generates a stable, browser-level fingerprint hash for one-device enforcement.
 * Does NOT use cookies — survives cookie clearing.
 */

async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function getCanvasFingerprint(): string {
  try {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return "no-canvas";
    ctx.textBaseline = "top";
    ctx.font = "14px 'Arial'";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "#f60";
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = "#069";
    ctx.fillText("HabeshaDFP🎬", 2, 15);
    ctx.fillStyle = "rgba(102,204,0,0.7)";
    ctx.fillText("HabeshaDFP🎬", 4, 17);
    return canvas.toDataURL();
  } catch {
    return "canvas-error";
  }
}

function getWebGLRenderer(): string {
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl") as WebGLRenderingContext | null;
    if (!gl) return "no-webgl";
    const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
    if (!debugInfo) return "no-debug-info";
    return gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || "unknown-renderer";
  } catch {
    return "webgl-error";
  }
}

function getTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return "unknown-tz";
  }
}

function getScreenSignature(): string {
  return `${screen.width}x${screen.height}x${screen.colorDepth}x${window.devicePixelRatio}`;
}

function getPlatformSignature(): string {
  const nav = navigator;
  return [
    nav.language || "en",
    nav.platform || "unknown",
    nav.hardwareConcurrency || 0,
    (nav as Navigator & { deviceMemory?: number }).deviceMemory || 0,
    nav.maxTouchPoints || 0,
  ].join("|");
}

/**
 * Returns a stable SHA-256 fingerprint for this browser/device combination.
 * Survives cookie clearing. Persisted in localStorage as secondary anchor.
 */
export async function getDeviceFingerprint(): Promise<string> {
  const STORAGE_KEY = "hbs_dfp";

  // Use stored fingerprint as primary anchor so it's stable across sessions
  const stored = localStorage.getItem(STORAGE_KEY);

  // Build raw signature from device signals
  const raw = [
    getCanvasFingerprint(),
    getWebGLRenderer(),
    getTimezone(),
    getScreenSignature(),
    getPlatformSignature(),
    navigator.userAgent,
  ].join("||");

  const computed = await sha256(raw);

  if (!stored) {
    localStorage.setItem(STORAGE_KEY, computed);
    return computed;
  }

  return stored;
}

/**
 * Returns a human-readable device name for display in the Admin panel.
 */
export function getDeviceName(): string {
  const ua = navigator.userAgent;
  if (/iPhone/.test(ua)) return "iPhone";
  if (/iPad/.test(ua)) return "iPad";
  if (/Android/.test(ua)) return "Android Device";
  if (/Mac/.test(ua)) return "Mac";
  if (/Windows/.test(ua)) return "Windows PC";
  if (/Linux/.test(ua)) return "Linux PC";
  return "Unknown Device";
}
