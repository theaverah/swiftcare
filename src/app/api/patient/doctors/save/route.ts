import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import mongoose from "mongoose";
import dbConnect from "@/lib/db";
import PatientProfile from "@/models/PatientProfile";

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json() as { doctorUserId?: string };
    const { doctorUserId } = body;
    if (!doctorUserId || !mongoose.Types.ObjectId.isValid(doctorUserId)) {
      return NextResponse.json({ error: "Invalid doctorUserId" }, { status: 400 });
    }

    await dbConnect();

    const userId     = new mongoose.Types.ObjectId(token.id as string);
    const doctorObjId = new mongoose.Types.ObjectId(doctorUserId);

    // Try to unsave first (pull from savedDoctors where the doctor is present)
    const pulled = await PatientProfile.findOneAndUpdate(
      { userId, savedDoctors: doctorObjId },
      { $pull: { savedDoctors: doctorObjId } },
      { new: true }
    ).lean();

    if (pulled) {
      // Doctor was saved → now unsaved
      return NextResponse.json({ isSaved: false });
    }

    // Doctor was not saved → save it (upsert in case PatientProfile doesn't exist yet)
    await PatientProfile.findOneAndUpdate(
      { userId },
      { $addToSet: { savedDoctors: doctorObjId } },
      { upsert: true }
    );

    return NextResponse.json({ isSaved: true });

  } catch (err) {
    console.error("[patient/doctors/save]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
