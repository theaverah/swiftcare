"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import type { Notification } from "@/types/notification";

export function useNotifications() {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Fetch persisted notifications on mount
  useEffect(() => {
    async function load() {
      try {
        const res  = await fetch("/api/patient/notifications");
        if (!res.ok) return;
        const data = await res.json() as { notifications: (Omit<Notification, "timestamp" | "read"> & { timestamp: string; read: boolean })[] };
        setNotifications(
          data.notifications.map(n => ({ ...n, timestamp: new Date(n.timestamp) }))
        );
      } catch { /* silent */ }
    }
    load();
  }, []);

  // Pusher real-time subscription
  useEffect(() => {
    const key    = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;
    const userId = (session?.user as { id?: string } | undefined)?.id;
    if (!key || !cluster || !userId) return;

    let pusher:  import("pusher-js").default | undefined;
    let channel: ReturnType<import("pusher-js").default["subscribe"]> | undefined;

    (async () => {
      const Pusher = (await import("pusher-js")).default;
      pusher  = new Pusher(key, { cluster });
      channel = pusher.subscribe(`patient-${userId}`);
      channel.bind("new-notification", (data: Omit<Notification, "timestamp"> & { timestamp: string }) => {
        setNotifications(prev => [
          { ...data, timestamp: new Date(data.timestamp), read: false },
          ...prev,
        ]);
      });
    })();

    return () => {
      channel?.unbind_all();
      pusher?.disconnect();
    };
  }, [(session?.user as { id?: string } | undefined)?.id]);

  const markAsRead = useCallback(async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    try { await fetch("/api/patient/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) }); }
    catch { /* silent */ }
  }, []);

  const markAllAsRead = useCallback(async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    try { await fetch("/api/patient/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ all: true }) }); }
    catch { /* silent */ }
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return { notifications, unreadCount, markAsRead, markAllAsRead };
}
