import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import dbConnect from "@/lib/db";
import Appointment from "@/models/Appointment";
import HealthRecord from "@/models/HealthRecord";
import User from "@/models/User";
import PatientProfile from "@/models/PatientProfile";

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await dbConnect();

    const appointments = await Appointment.find({ doctorId: token.id })
      .sort({ scheduledAt: -1 })
      .lean();

    if (appointments.length === 0) return NextResponse.json({ consultations: [] });

    const patientIds     = [...new Set(appointments.map((a) => String(a.patientId)))];
    const appointmentIds = appointments.map((a) => String(a._id));

    const [patients, profiles, records] = await Promise.all([
      User.find({ _id: { $in: patientIds } }).select("name").lean() as Promise<{ _id: { toString(): string }; name: string }[]>,
      PatientProfile.find({ userId: { $in: patientIds } })
        .select("userId profileImage")
        .lean() as Promise<{ _id: unknown; userId: { toString(): string }; profileImage?: string }[]>,
      HealthRecord.find({ appointmentId: { $in: appointmentIds } })
        .select("appointmentId")
        .lean() as Promise<{ appointmentId: { toString(): string } }[]>,
    ]);

    const patientMap  = new Map(patients.map((p) => [p._id.toString(), p]));
    const profileMap  = new Map(profiles.map((p) => [p.userId.toString(), p]));
    const recordedSet = new Set(records.map((r) => r.appointmentId.toString()));

    const consultations = appointments.map((appt) => {
      const patientId = String(appt.patientId);
      const patient   = patientMap.get(patientId);
      const profile   = profileMap.get(patientId);

      const displayName = appt.forSelf === false && appt.patientName
        ? appt.patientName
        : (patient?.name ?? "Unknown Patient");

      return {
        id:                  String(appt._id),
        patientId,
        patientName:         displayName,
        patientActualName:   patient?.name ?? "Unknown Patient",
        patientProfileImage: profile?.profileImage ?? null,
        chiefComplaint:      appt.chiefComplaint ?? null,
        scheduledAt:         (appt.scheduledAt as Date).toISOString(),
        durationMinutes:     appt.durationMinutes,
        status:              appt.status,
        hasRecords:          recordedSet.has(String(appt._id)),
      };
    });

    return NextResponse.json({ consultations });
  } catch (err) {
    console.error("[doctor/consultations GET]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
