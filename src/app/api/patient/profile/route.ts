import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import PatientProfile from "@/models/PatientProfile";

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      firstName, lastName, birthday, contactNumber,
      weight, height, conditions, allergies, medications,
    } = body;

    await dbConnect();

    const fullName = `${firstName} ${lastName}`.trim();
    await User.findByIdAndUpdate(token.id, { name: fullName });

    await PatientProfile.findOneAndUpdate(
      { userId: token.id },
      {
        userId:             token.id,
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
