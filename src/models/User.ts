import mongoose, { Schema, Document, Model } from "mongoose";

export type UserRole = "patient" | "doctor";

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  password: string;
  name: string;
  role: UserRole;
  isVerified: boolean;
  verificationCode?: string;
  verificationExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 8,
      select: false,
    },
    name: {
      type: String,
      default: "",
      trim: true,
    },
    role: {
      type: String,
      enum: ["patient", "doctor"],
      required: [true, "Role is required"],
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationCode: { type: String, select: false },
    verificationExpires: { type: Date, select: false },
  },
  { timestamps: true }
);

const User: Model<IUser> =
  (mongoose.models.User as Model<IUser>) ?? mongoose.model<IUser>("User", UserSchema);

export default User;
