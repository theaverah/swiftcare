import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import DoctorProfile from "@/models/DoctorProfile";
import Appointment from "@/models/Appointment";

export async function DELETE(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await dbConnect();

    await Promise.all([
      DoctorProfile.deleteOne({ userId: token.id }),
      Appointment.deleteMany({ doctorId: token.id }),
      User.findByIdAndDelete(token.id),
    ]);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[doctor/account/delete]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
