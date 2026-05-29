import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import dbConnect from "@/lib/db";
import HealthRecord, { type HealthRecordType } from "@/models/HealthRecord";
import User from "@/models/User";
import DoctorProfile from "@/models/DoctorProfile";
import Appointment from "@/models/Appointment";

const VALID_TYPES: HealthRecordType[] = [
  "prescription",
  "consultation_note",
  "lab_request",
  "medical_certificate",
  "referral",
];

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const typeParam = searchParams.get("type") as HealthRecordType | null;

    await dbConnect();

    const query: { patientId: string; type?: HealthRecordType } = { patientId: token.id };
    if (typeParam && VALID_TYPES.includes(typeParam)) query.type = typeParam;

    const records = await HealthRecord.find(query)
      .sort({ issuedAt: -1 })
      .lean();

    if (records.length === 0) return NextResponse.json({ records: [] });

    const doctorIds     = [...new Set(records.map(r => String(r.doctorId)))];
    const appointmentIds = [...new Set(records.map(r => String(r.appointmentId)))];

    const [doctors, profiles, appointments] = await Promise.all([
      User.find({ _id: { $in: doctorIds } }).select("name").lean(),
      DoctorProfile.find({ userId: { $in: doctorIds } })
        .select("userId specializations profileImage")
        .lean(),
      Appointment.find({ _id: { $in: appointmentIds } })
        .select("scheduledAt")
        .lean(),
    ]);

    type DocUser  = { _id: { toString(): string }; name: string };
    type DocProf  = { _id: unknown; userId: { toString(): string }; specializations?: string[]; profileImage?: string };
    type Appt     = { _id: { toString(): string }; scheduledAt: Date };

    const doctorMap  = new Map((doctors      as DocUser[]).map(d => [d._id.toString(), d]));
    const profileMap = new Map((profiles     as DocProf[]).map(p => [p.userId.toString(), p]));
    const apptMap    = new Map((appointments as Appt[]).map(a  => [a._id.toString(), a]));

    const enriched = records.map(r => {
      const doctorId = String(r.doctorId);
      const apptId   = String(r.appointmentId);
      const doctor   = doctorMap.get(doctorId);
      const profile  = profileMap.get(doctorId);
      const appt     = apptMap.get(apptId);

      return {
        id:             String(r._id),
        type:           r.type,
        issuedAt:       r.issuedAt,
        doctor: {
          name:            doctor?.name ?? "Unknown Doctor",
          specializations: profile?.specializations ?? [],
          profileImage:    profile?.profileImage ?? null,
        },
        consultation: {
          id:          apptId,
          scheduledAt: appt?.scheduledAt ?? null,
        },
        // type-specific content
        medications:    r.medications,
        notes:          r.notes,
        tests:          r.tests,
        purpose:        r.purpose,
        referredTo:     r.referredTo,
        referralReason: r.referralReason,
      };
    });

    return NextResponse.json({ records: enriched });
  } catch (err) {
    console.error("[patient/records GET]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
