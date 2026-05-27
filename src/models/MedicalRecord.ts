import mongoose, { Schema, Document, Model } from "mongoose";

export type RecordType = "prescription" | "consultation_notes" | "lab_result" | "diagnosis";

export interface IPrescriptionItem {
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
}

export interface IMedicalRecord extends Document {
  _id: mongoose.Types.ObjectId;
  appointmentId: mongoose.Types.ObjectId;
  patientId: mongoose.Types.ObjectId;
  doctorId: mongoose.Types.ObjectId;
  type: RecordType;
  diagnosis?: string;
  prescriptions: IPrescriptionItem[];
  notes?: string;
  attachments: string[];
  issuedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PrescriptionItemSchema = new Schema<IPrescriptionItem>(
  {
    medication: { type: String, required: true },
    dosage: { type: String, required: true },
    frequency: { type: String, required: true },
    duration: { type: String, required: true },
    instructions: { type: String },
  },
  { _id: false }
);

const MedicalRecordSchema = new Schema<IMedicalRecord>(
  {
    appointmentId: {
      type: Schema.Types.ObjectId,
      ref: "Appointment",
      required: true,
    },
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
    type: {
      type: String,
      enum: ["prescription", "consultation_notes", "lab_result", "diagnosis"],
      required: true,
    },
    diagnosis: { type: String },
    prescriptions: { type: [PrescriptionItemSchema], default: [] },
    notes: { type: String },
    attachments: { type: [String], default: [] },
    issuedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

MedicalRecordSchema.index({ patientId: 1, issuedAt: -1 });
MedicalRecordSchema.index({ appointmentId: 1 });

const MedicalRecord: Model<IMedicalRecord> =
  mongoose.models.MedicalRecord ??
  mongoose.model<IMedicalRecord>("MedicalRecord", MedicalRecordSchema);

export default MedicalRecord;
