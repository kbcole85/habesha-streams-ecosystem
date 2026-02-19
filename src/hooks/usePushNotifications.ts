import { useEffect, useState, useCallback } from "react";
import { Capacitor } from "@capacitor/core";
import {
  PushNotifications,
  Token,
  ActionPerformed,
  PushNotificationSchema,
} from "@capacitor/push-notifications";
import { Haptics, ImpactStyle } from "@capacitor/haptics";

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  receivedAt: Date;
}

export interface UsePushNotificationsReturn {
  isRegistered: boolean;
  fcmToken: string | null;
  notifications: NotificationItem[];
  permissionStatus: "granted" | "denied" | "prompt" | "unavailable";
  requestPermission: () => Promise<boolean>;
  clearNotifications: () => void;
}

export function usePushNotifications(): UsePushNotificationsReturn {
  const [isRegistered, setIsRegistered] = useState(false);
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [permissionStatus, setPermissionStatus] = useState<
    "granted" | "denied" | "prompt" | "unavailable"
  >("unavailable");

  const isNative = Capacitor.isNativePlatform();

  const addNotification = useCallback((n: PushNotificationSchema) => {
    setNotifications((prev) => [
      {
        id: n.id ?? crypto.randomUUID(),
        title: n.title ?? "Habesha Streams",
        body: n.body ?? "",
        data: n.data as Record<string, unknown>,
        receivedAt: new Date(),
      },
      ...prev.slice(0, 49), // keep last 50
    ]);
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isNative) {
      setPermissionStatus("unavailable");
      return false;
    }
    try {
      let status = await PushNotifications.checkPermissions();
      if (status.receive === "prompt") {
        status = await PushNotifications.requestPermissions();
      }
      if (status.receive === "granted") {
        setPermissionStatus("granted");
        await PushNotifications.register();
        return true;
      }
      setPermissionStatus(status.receive as "denied");
      return false;
    } catch {
      return false;
    }
  }, [isNative]);

  const clearNotifications = useCallback(() => setNotifications([]), []);

  useEffect(() => {
    if (!isNative) return;

    // Listeners
    const regOk = PushNotifications.addListener("registration", (token: Token) => {
      setFcmToken(token.value);
      setIsRegistered(true);
      console.log("[Push] FCM token:", token.value);
    });

    const regErr = PushNotifications.addListener("registrationError", (err) => {
      console.error("[Push] Registration error:", err);
      setIsRegistered(false);
    });

    const received = PushNotifications.addListener(
      "pushNotificationReceived",
      async (notification: PushNotificationSchema) => {
        await Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
        addNotification(notification);
      }
    );

    const actioned = PushNotifications.addListener(
      "pushNotificationActionPerformed",
      (action: ActionPerformed) => {
        addNotification(action.notification);
        // Navigate based on data payload
        const data = action.notification.data as Record<string, string> | undefined;
        if (data?.contentId) {
          window.location.href = `/watch/${data.contentId}`;
        }
      }
    );

    // Check current permission and auto-register if already granted
    PushNotifications.checkPermissions().then((s) => {
      if (s.receive === "granted") {
        setPermissionStatus("granted");
        PushNotifications.register().catch(console.error);
      } else {
        setPermissionStatus(s.receive as "denied" | "prompt");
      }
    });

    return () => {
      regOk.then((l) => l.remove());
      regErr.then((l) => l.remove());
      received.then((l) => l.remove());
      actioned.then((l) => l.remove());
    };
  }, [isNative, addNotification]);

  return {
    isRegistered,
    fcmToken,
    notifications,
    permissionStatus,
    requestPermission,
    clearNotifications,
  };
}
