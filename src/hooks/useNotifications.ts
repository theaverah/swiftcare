"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import type { Notification } from "@/types/notification";

const DUMMY: Notification[] = [
  {
    id: "1",
    type: "appointment_booked",
    message: "Your appointment with Dr. Maria Reyes has been confirmed for June 2 at 10:00 AM.",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    read: false,
    href: "/patient/appointments",
  },
  {
    id: "2",
    type: "upcoming_reminder",
    message: "Reminder: You have an appointment tomorrow at 10:00 AM with Dr. Reyes.",
    timestamp: new Date(Date.now() - 26 * 60 * 60 * 1000),
    read: true,
    href: "/patient/appointments",
  },
];

export function useNotifications() {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    // TODO: replace with GET /api/patient/notifications
    setNotifications(DUMMY);
  }, []);

  // Pusher subscription for real-time notifications
  useEffect(() => {
    const key     = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;
    const userId  = (session?.user as { id?: string } | undefined)?.id;
    if (!key || !cluster || !userId) return;

    let pusher: import("pusher-js").default | undefined;
    let channel: ReturnType<import("pusher-js").default["subscribe"]> | undefined;

    (async () => {
      const Pusher = (await import("pusher-js")).default;
      pusher  = new Pusher(key, { cluster });
      channel = pusher.subscribe(`patient-${userId}`);
      channel.bind("new-notification", (data: Omit<Notification, "timestamp"> & { timestamp: string }) => {
        setNotifications((prev) => [
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

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    // TODO: POST /api/patient/notifications/read { id }
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    // TODO: POST /api/patient/notifications/read-all
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return { notifications, unreadCount, markAsRead, markAllAsRead };
}
