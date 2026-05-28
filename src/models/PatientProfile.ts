import mongoose, { Schema, Document, Model } from "mongoose";

export interface IEmergencyContact {
  name: string;
  phone: string;
  relationship: string;
}

export interface IPatientProfile extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  dateOfBirth?: Date;
  weight?: number;
  height?: number;
  bloodType?: string;
  profilePicture?: string;
  phone?: string;
  address?: string;
  allergies: string[];
  currentMedications: string[];
  medicalHistory?: string;
  emergencyContact?: IEmergencyContact;
  savedDoctors: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const PatientProfileSchema = new Schema<IPatientProfile>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    dateOfBirth: { type: Date },
    weight: { type: Number, min: 0 },
    height: { type: Number, min: 0 },
    bloodType: {
      type: String,
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
    },
    profilePicture: { type: String },
    phone: { type: String, trim: true },
    address: { type: String, trim: true },
    allergies: { type: [String], default: [] },
    currentMedications: { type: [String], default: [] },
    medicalHistory: { type: String },
    emergencyContact: {
      name: { type: String },
      phone: { type: String },
      relationship: { type: String },
    },
    savedDoctors: [{ type: Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

const PatientProfile: Model<IPatientProfile> =
  mongoose.models.PatientProfile ??
  mongoose.model<IPatientProfile>("PatientProfile", PatientProfileSchema);

export default PatientProfile;
