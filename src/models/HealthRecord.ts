import mongoose, { Schema, Document, Model } from "mongoose";

export type HealthRecordType =
  | "prescription"
  | "consultation_note"
  | "lab_request"
  | "medical_certificate"
  | "referral";

export interface IMedication {
  name:      string;
  dosage:    string;
  frequency: string;
  duration:  string;
}

export interface ILabTest {
  name: string;
}

export interface IHealthRecord extends Document {
  _id:           mongoose.Types.ObjectId;
  patientId:     mongoose.Types.ObjectId;
  doctorId:      mongoose.Types.ObjectId;
  appointmentId: mongoose.Types.ObjectId;
  type:          HealthRecordType;
  issuedAt:      Date;
  // prescription
  medications?:    IMedication[];
  // consultation_note
  notes?:          string;
  // lab_request
  tests?:          ILabTest[];
  // medical_certificate
  purpose?:        string;
  // referral
  referredTo?:     string;
  referralReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const MedicationSchema = new Schema<IMedication>(
  {
    name:      { type: String, required: true },
    dosage:    { type: String, required: true },
    frequency: { type: String, required: true },
    duration:  { type: String, required: true },
  },
  { _id: false }
);

const LabTestSchema = new Schema<ILabTest>(
  { name: { type: String, required: true } },
  { _id: false }
);

const HealthRecordSchema = new Schema<IHealthRecord>(
  {
    patientId:     { type: Schema.Types.ObjectId, ref: "User",        required: true },
    doctorId:      { type: Schema.Types.ObjectId, ref: "User",        required: true },
    appointmentId: { type: Schema.Types.ObjectId, ref: "Appointment", required: true },
    type: {
      type:     String,
      enum:     ["prescription", "consultation_note", "lab_request", "medical_certificate", "referral"],
      required: true,
    },
    issuedAt:      { type: Date, default: Date.now },
    medications:   { type: [MedicationSchema], default: undefined },
    notes:         { type: String },
    tests:         { type: [LabTestSchema], default: undefined },
    purpose:       { type: String },
    referredTo:    { type: String },
    referralReason:{ type: String },
  },
  { timestamps: true }
);

HealthRecordSchema.index({ patientId: 1, issuedAt: -1 });
HealthRecordSchema.index({ patientId: 1, type: 1 });

const HealthRecord: Model<IHealthRecord> =
  mongoose.models.HealthRecord ??
  mongoose.model<IHealthRecord>("HealthRecord", HealthRecordSchema);

export default HealthRecord;
