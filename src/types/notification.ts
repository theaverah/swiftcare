export type NotificationType =
  | "appointment_booked"
  | "upcoming_reminder"
  | "rescheduled"
  | "cancelled";

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  timestamp: Date;
  read: boolean;
  href: string;
}
