import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import PatientProfile from "@/models/PatientProfile";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json() as { doctorUserId?: string };
    const { doctorUserId } = body;
    if (!doctorUserId || !mongoose.Types.ObjectId.isValid(doctorUserId)) {
      return NextResponse.json({ error: "Invalid doctorUserId" }, { status: 400 });
    }

    await dbConnect();

    const profile = await PatientProfile.findOne({ userId: session.user.id }).select("savedDoctors");
    if (!profile) {
      return NextResponse.json({ error: "Patient profile not found" }, { status: 404 });
    }

    const alreadySaved = profile.savedDoctors.some((id) => String(id) === doctorUserId);
    const doctorObjId = new mongoose.Types.ObjectId(doctorUserId);

    await PatientProfile.findOneAndUpdate(
      { userId: session.user.id },
      alreadySaved
        ? { $pull: { savedDoctors: doctorObjId } }
        : { $addToSet: { savedDoctors: doctorObjId } }
    );

    return NextResponse.json({ isSaved: !alreadySaved });
  } catch (err) {
    console.error("[patient/doctors/save]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
