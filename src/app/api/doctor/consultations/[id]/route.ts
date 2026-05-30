import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import dbConnect from "@/lib/db";
import Appointment from "@/models/Appointment";
import User from "@/models/User";
import mongoose from "mongoose";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    await dbConnect();

    const appt = await Appointment.findOne({ _id: id, doctorId: token.id }).lean();
    if (!appt) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const patient = await User
      .findById(appt.patientId)
      .select("name")
      .lean() as { name?: string } | null;

    const patientDisplayName = appt.forSelf
      ? (patient?.name ?? "Patient")
      : (appt.patientName ?? patient?.name ?? "Patient");

    return NextResponse.json({
      consultation: {
        id:             String(appt._id),
        patientName:    patientDisplayName,
        scheduledAt:    (appt.scheduledAt as Date).toISOString(),
        durationMinutes: appt.durationMinutes,
        status:         appt.status,
        chiefComplaint: appt.chiefComplaint ?? null,
      },
    });
  } catch (err) {
    console.error("[doctor/consultations/[id] GET]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
