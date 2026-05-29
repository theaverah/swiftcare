import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import PatientProfile from "@/models/PatientProfile";
import PendingRegistration from "@/models/PendingRegistration";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const body = await req.json();
    const {
      firstName, lastName, birthday, contactNumber,
      weight, height, conditions, allergies, medications,
      pendingEmail, // present only during new registration
    } = body;

    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    let userId: string;

    if (!token?.id) {
      // New registration — create User from PendingRegistration
      if (!pendingEmail) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const pending = await PendingRegistration.findOne({ email: pendingEmail.toLowerCase() });
      if (!pending) {
        return NextResponse.json(
          { error: "Registration session expired. Please register again." },
          { status: 404 }
        );
      }

      const fullName = `${firstName} ${lastName}`.trim();

      // Idempotent — don't double-create if they retry
      let user = await User.findOne({ email: pending.email });
      if (!user) {
        user = await User.create({
          email:      pending.email,
          password:   pending.password,
          name:       fullName,
          role:       "patient",
          isVerified: true,
        });
      } else {
        await User.findByIdAndUpdate(user._id, { name: fullName });
      }

      await PendingRegistration.deleteOne({ email: pending.email });
      userId = String(user._id);
    } else {
      userId = token.id;
      const fullName = `${firstName} ${lastName}`.trim();
      await User.findByIdAndUpdate(userId, { name: fullName });
    }

    await PatientProfile.findOneAndUpdate(
      { userId },
      {
        userId,
        dateOfBirth:        birthday ? new Date(birthday) : undefined,
        phone:              contactNumber ? `+63${contactNumber}` : undefined,
        weight:             weight  ? parseFloat(weight)  : undefined,
        height:             height  ? parseFloat(height)  : undefined,
        allergies:          allergies ?? [],
        currentMedications: medications ?? [],
        medicalHistory:     conditions?.length ? conditions.join(", ") : undefined,
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({ success: true });

  } catch (err) {
    console.error("[patient/profile]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
