import type { DoctorAvailability } from "./doctor";

export interface ConsultationDoctor {
  userId: string;
  doctorProfileId: string;
  name: string;
  profileImage: string | null;
  specializations: string[];
  consultationFee: number | null;
  availability: DoctorAvailability[];
}

export type ConsultationStatus =
  | "pending"
  | "confirmed"
  | "ongoing"
  | "completed"
  | "cancelled"
  | "rescheduled"
  | "no_show";

export interface Consultation {
  id: string;
  doctor: ConsultationDoctor;
  scheduledAt: string;
  durationMinutes: number;
  status: ConsultationStatus;
  forSelf: boolean;
  patientName?: string;
  chiefComplaint?: string;
  paymentStatus: "pending" | "paid";
}
