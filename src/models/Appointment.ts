import mongoose, { Schema, Document, Model } from "mongoose";

export type AppointmentStatus =
  | "pending"
  | "confirmed"
  | "ongoing"
  | "completed"
  | "cancelled"
  | "rescheduled"
  | "no_show";

export type ConsultationType = "video" | "chat";
export type CancelledBy = "patient" | "doctor";

export interface IAppointment extends Document {
  _id: mongoose.Types.ObjectId;
  patientId: mongoose.Types.ObjectId;
  doctorId: mongoose.Types.ObjectId;
  scheduledAt: Date;
  durationMinutes: number;
  status: AppointmentStatus;
  consultationType: ConsultationType;
  dailyRoomUrl?: string;
  chiefComplaint?: string;
  cancelledBy?: CancelledBy;
  cancellationReason?: string;
  rescheduledFrom?: mongoose.Types.ObjectId;
  reminderSent: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AppointmentSchema = new Schema<IAppointment>(
  {
    patientId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    doctorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    scheduledAt: {
      type: Date,
      required: [true, "Scheduled date/time is required"],
    },
    durationMinutes: {
      type: Number,
      default: 30,
      min: 15,
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "ongoing", "completed", "cancelled", "rescheduled", "no_show"],
      default: "pending",
    },
    consultationType: {
      type: String,
      enum: ["video", "chat"],
      default: "video",
    },
    dailyRoomUrl: { type: String },
    chiefComplaint: { type: String },
    cancelledBy: {
      type: String,
      enum: ["patient", "doctor"],
    },
    cancellationReason: { type: String },
    rescheduledFrom: {
      type: Schema.Types.ObjectId,
      ref: "Appointment",
    },
    reminderSent: { type: Boolean, default: false },
  },
  { timestamps: true }
);

AppointmentSchema.index({ patientId: 1, scheduledAt: -1 });
AppointmentSchema.index({ doctorId: 1, scheduledAt: -1 });
AppointmentSchema.index({ status: 1 });

const Appointment: Model<IAppointment> =
  mongoose.models.Appointment ??
  mongoose.model<IAppointment>("Appointment", AppointmentSchema);

export default Appointment;
