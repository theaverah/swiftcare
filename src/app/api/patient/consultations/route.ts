import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import dbConnect from "@/lib/db";
import Appointment from "@/models/Appointment";
import User from "@/models/User";
import DoctorProfile from "@/models/DoctorProfile";

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await dbConnect();

    const appointments = await Appointment.find({ patientId: token.id })
      .sort({ scheduledAt: -1 })
      .lean();

    if (appointments.length === 0) return NextResponse.json({ consultations: [] });

    const doctorIds = [...new Set(appointments.map(a => String(a.doctorId)))];

    const [doctors, profiles] = await Promise.all([
      User.find({ _id: { $in: doctorIds } }).select("name").lean(),
      DoctorProfile.find({ userId: { $in: doctorIds } })
        .select("userId specializations profileImage consultationFee availability")
        .lean(),
    ]);

    type DocUser  = { _id: { toString(): string }; name: string };
    type DocProf  = {
      _id:              { toString(): string };
      userId:           { toString(): string };
      specializations?: string[];
      profileImage?:    string;
      consultationFee?: number;
      availability?:    unknown[];
    };

    const doctorMap  = new Map((doctors  as DocUser[]).map(d => [d._id.toString(), d]));
    const profileMap = new Map((profiles as DocProf[]).map(p => [p.userId.toString(), p]));

    const consultations = appointments.map(appt => {
      const doctorId = String(appt.doctorId);
      const doctor   = doctorMap.get(doctorId);
      const profile  = profileMap.get(doctorId);

      return {
        id: String(appt._id),
        doctor: {
          userId:          doctorId,
          doctorProfileId: profile ? profile._id.toString() : "",
          name:            doctor?.name ?? "Unknown Doctor",
          profileImage:    profile?.profileImage    ?? null,
          specializations: profile?.specializations ?? [],
          consultationFee: profile?.consultationFee ?? null,
          availability:    profile?.availability    ?? [],
        },
        scheduledAt:      (appt.scheduledAt as Date).toISOString(),
        durationMinutes:  appt.durationMinutes,
        status:           appt.status,
        forSelf:          appt.forSelf,
        patientName:      appt.patientName,
        chiefComplaint:   appt.chiefComplaint,
        paymentStatus:    "pending" as const,
      };
    });

    return NextResponse.json({ consultations });
  } catch (err) {
    console.error("[patient/consultations GET]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
