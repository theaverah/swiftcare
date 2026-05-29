import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPendingRegistration extends Document {
  email:      string;
  password:   string; // bcrypt-hashed
  role:       "patient" | "doctor";
  otp:        string;
  otpExpires: Date;
  createdAt:  Date;
}

const PendingRegistrationSchema = new Schema<IPendingRegistration>(
  {
    email:      { type: String, required: true, unique: true, lowercase: true, trim: true },
    password:   { type: String, required: true },
    role:       { type: String, enum: ["patient", "doctor"], required: true },
    otp:        { type: String, required: true },
    otpExpires: { type: Date, required: true },
  },
  { timestamps: true }
);

// Auto-delete after 1 hour if registration is never completed
PendingRegistrationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 3600 });

const PendingRegistration: Model<IPendingRegistration> =
  mongoose.models.PendingRegistration ??
  mongoose.model<IPendingRegistration>("PendingRegistration", PendingRegistrationSchema);

export default PendingRegistration;
