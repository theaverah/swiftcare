import dbConnect from "@/lib/db";
import Notification from "@/models/Notification";
import pusherServer from "@/lib/pusher-server";
import type { NotificationType } from "@/models/Notification";

interface NotifyPayload {
  userId:  string;
  type:    NotificationType;
  title:   string;
  message: string;
  href?:   string;
  data?:   Record<string, unknown>;
}

export async function notify(payload: NotifyPayload): Promise<void> {
  try {
    await dbConnect();

    const doc = await Notification.create({
      userId:  payload.userId,
      type:    payload.type,
      title:   payload.title,
      message: payload.message,
      data:    payload.data,
      isRead:  false,
    });

    await pusherServer.trigger(`patient-${payload.userId}`, "new-notification", {
      id:        String(doc._id),
      type:      payload.type,
      title:     payload.title,
      message:   payload.message,
      href:      payload.href ?? "/patient/consultations",
      timestamp: doc.createdAt.toISOString(),
      read:      false,
    });
  } catch (err) {
    console.error("[notify]", err);
  }
}
