import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import dbConnect from "@/lib/db";
import Appointment from "@/models/Appointment";
import User from "@/models/User";
import DoctorProfile from "@/models/DoctorProfile";
import mongoose from "mongoose";

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}
function endOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
}
function startOfWeek(d: Date) {
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1 - day);
  const mon = new Date(d);
  mon.setDate(d.getDate() + diff);
  return startOfDay(mon);
}
function endOfWeek(d: Date) {
  const mon = startOfWeek(d);
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  return endOfDay(sun);
}
function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
}
function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
}

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const doctorId = new mongoose.Types.ObjectId(token.id as string);
    await dbConnect();

    const now        = new Date();
    const todayStart = startOfDay(now);
    const todayEnd   = endOfDay(now);
    const weekStart  = startOfWeek(now);
    const weekEnd    = endOfWeek(now);
    const monthStart = startOfMonth(now);
    const monthEnd   = endOfMonth(now);

    const [
      weekCount,
      uniquePatients,
      completedThisMonth,
      todayAppts,
      upcomingAppts,
      doctorProfile,
    ] = await Promise.all([
      Appointment.countDocuments({
        doctorId,
        scheduledAt: { $gte: weekStart, $lte: weekEnd },
        status: { $nin: ["cancelled", "no_show"] },
      }),
      Appointment.distinct("patientId", { doctorId }),
      Appointment.countDocuments({
        doctorId,
        status: "completed",
        scheduledAt: { $gte: monthStart, $lte: monthEnd },
      }),
      Appointment.find({
        doctorId,
        scheduledAt: { $gte: todayStart, $lte: todayEnd },
        status: { $nin: ["cancelled"] },
      }).sort({ scheduledAt: 1 }).lean(),
      Appointment.find({
        doctorId,
        scheduledAt: { $gt: todayEnd },
        status: { $in: ["confirmed", "pending"] },
      }).sort({ scheduledAt: 1 }).limit(5).lean(),
      DoctorProfile.findOne({ userId: doctorId }).select("consultationFee").lean(),
    ]);

    const fee             = (doctorProfile as { consultationFee?: number } | null)?.consultationFee ?? 0;
    const earningsThisMonth = completedThisMonth * fee;

    // Resolve patient names for today + upcoming
    const patientIds = [
      ...todayAppts.map(a => a.patientId),
      ...upcomingAppts.map(a => a.patientId),
    ];
    const patients = await User.find({ _id: { $in: patientIds } })
      .select("name")
      .lean() as { _id: mongoose.Types.ObjectId; name: string }[];
    const pMap = new Map(patients.map(p => [String(p._id), p.name]));

    type ApptLean = {
      _id: mongoose.Types.ObjectId;
      patientId: mongoose.Types.ObjectId;
      forSelf: boolean;
      patientName?: string;
      scheduledAt: Date;
      durationMinutes: number;
      status: string;
      chiefComplaint?: string;
    };

    function fmt(a: ApptLean) {
      const displayName = a.forSelf
        ? (pMap.get(String(a.patientId)) ?? "Patient")
        : (a.patientName ?? pMap.get(String(a.patientId)) ?? "Patient");
      return {
        id:              String(a._id),
        patientName:     displayName,
        scheduledAt:     a.scheduledAt.toISOString(),
        durationMinutes: a.durationMinutes,
        status:          a.status,
        chiefComplaint:  a.chiefComplaint ?? null,
      };
    }

    return NextResponse.json({
      stats: {
        consultationsThisWeek: weekCount,
        totalPatients:         uniquePatients.length,
        earningsThisMonth,
      },
      todaySchedule: todayAppts.map(a => fmt(a as ApptLean)),
      upcoming:      upcomingAppts.map(a => fmt(a as ApptLean)),
    });

  } catch (err) {
    console.error("[doctor/dashboard GET]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
