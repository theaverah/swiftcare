import mongoose, { Schema, Document, Model } from "mongoose";

export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface IAvailabilitySlot {
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

export interface IBlockedSlot {
  date: Date;
  startTime: string;
  endTime: string;
  reason?: string;
}

export interface IDoctorProfile extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  specializations: string[];
  bio?: string;
  profileImage?: string;
  licenseNumber?: string;
  yearsOfExperience?: number;
  consultationFee?: number;
  languages: string[];
  availability: IAvailabilitySlot[];
  blockedSlots: IBlockedSlot[];
  rating: number;
  totalReviews: number;
  isAcceptingPatients: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AvailabilitySlotSchema = new Schema<IAvailabilitySlot>(
  {
    dayOfWeek: { type: Number, min: 0, max: 6, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    isAvailable: { type: Boolean, default: true },
  },
  { _id: false }
);

const BlockedSlotSchema = new Schema<IBlockedSlot>(
  {
    date: { type: Date, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    reason: { type: String },
  },
  { _id: false }
);

const DoctorProfileSchema = new Schema<IDoctorProfile>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    specializations: {
      type: [String],
      required: [true, "At least one specialization is required"],
      validate: {
        validator: (v: string[]) => v.length > 0,
        message: "At least one specialization is required",
      },
    },
    bio: { type: String },
    profileImage: { type: String },
    licenseNumber: { type: String },
    yearsOfExperience: { type: Number, min: 0 },
    consultationFee: { type: Number, min: 0 },
    languages: { type: [String], default: ["English"] },
    availability: { type: [AvailabilitySlotSchema], default: [] },
    blockedSlots: { type: [BlockedSlotSchema], default: [] },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    totalReviews: { type: Number, default: 0 },
    isAcceptingPatients: { type: Boolean, default: true },
  },
  { timestamps: true }
);

DoctorProfileSchema.index({ specializations: 1 });
DoctorProfileSchema.index({ rating: -1 });

const DoctorProfile: Model<IDoctorProfile> =
  mongoose.models.DoctorProfile ??
  mongoose.model<IDoctorProfile>("DoctorProfile", DoctorProfileSchema);

export default DoctorProfile;
