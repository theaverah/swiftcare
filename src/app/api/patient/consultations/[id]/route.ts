import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import dbConnect from "@/lib/db";
import Appointment from "@/models/Appointment";
import User from "@/models/User";
import DoctorProfile from "@/models/DoctorProfile";
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

    const appt = await Appointment.findOne({ _id: id, patientId: token.id }).lean();
    if (!appt) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const doctorId = String(appt.doctorId);
    const [doctor, profile] = await Promise.all([
      User.findById(doctorId).select("name").lean(),
      DoctorProfile.findOne({ userId: doctorId })
        .select("specializations profileImage consultationFee availability")
        .lean(),
    ]);

    type DocUser = { name?: string };
    type DocProf = {
      _id: { toString(): string };
      specializations?: string[];
      profileImage?: string;
      consultationFee?: number;
      availability?: unknown[];
    };

    const d = doctor as DocUser | null;
    const p = profile as DocProf | null;

    return NextResponse.json({
      consultation: {
        id:             String(appt._id),
        doctor: {
          userId:          doctorId,
          doctorProfileId: p ? p._id.toString() : "",
          name:            d?.name ?? "Unknown Doctor",
          profileImage:    p?.profileImage    ?? null,
          specializations: p?.specializations ?? [],
          consultationFee: p?.consultationFee ?? null,
          availability:    p?.availability    ?? [],
        },
        scheduledAt:      (appt.scheduledAt as Date).toISOString(),
        durationMinutes:  appt.durationMinutes,
        status:           appt.status,
        dailyRoomUrl:     appt.dailyRoomUrl,
        forSelf:          appt.forSelf,
        patientName:      appt.patientName,
        chiefComplaint:   appt.chiefComplaint,
        paymentStatus:    "pending" as const,
      },
    });
  } catch (err) {
    console.error("[patient/consultations/[id] GET]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
