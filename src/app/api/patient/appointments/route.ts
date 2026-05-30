import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import dbConnect from "@/lib/db";
import Appointment from "@/models/Appointment";
import User from "@/models/User";
import { notify } from "@/lib/notify";

function parseSlotToDate(dateStr: string, slot: string): Date {
  // dateStr: "2026-05-30", slot: "9:00 AM"
  const [time, ampm] = slot.split(" ");
  let [h, m] = time.split(":").map(Number);
  if (ampm === "PM" && h !== 12) h += 12;
  if (ampm === "AM" && h === 12) h = 0;
  const d = new Date(`${dateStr}T00:00:00`);
  d.setHours(h, m ?? 0, 0, 0);
  return d;
}

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json() as {
      doctorUserId:    string;
      date:            string;
      assignedSlot:    string;
      forSelf:         boolean;
      patientName?:    string;
      relationship?:   string;
      chiefComplaint?: string;
      additionalNotes?:string;
    };

    const { doctorUserId, date, assignedSlot, forSelf, patientName, relationship, chiefComplaint, additionalNotes } = body;

    if (!doctorUserId || !date || !assignedSlot) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    await dbConnect();

    const scheduledAt = parseSlotToDate(date, assignedSlot);

    const appointment = await Appointment.create({
      patientId:       token.id,
      doctorId:        doctorUserId,
      scheduledAt,
      durationMinutes: 30,
      status:          "confirmed",
      consultationType:"video",
      chiefComplaint:  chiefComplaint || undefined,
      additionalNotes: additionalNotes || undefined,
      forSelf,
      patientName:     !forSelf ? patientName : undefined,
      relationship:    !forSelf ? relationship : undefined,
    });

    // Notify patient (DB + Pusher)
    const doctor = await User.findById(doctorUserId).select("name").lean();
    const doctorName = (doctor as { name?: string } | null)?.name ?? "your doctor";
    const dateLabel = new Date(date + "T12:00:00").toLocaleDateString("en-PH", {
      weekday: "long", month: "long", day: "numeric",
    });
    notify({
      userId:  String(token.id),
      type:    "appointment_confirmed",
      title:   "Consultation confirmed",
      message: `Your consultation with Dr. ${doctorName} on ${dateLabel} is confirmed.`,
      href:    "/patient/consultations",
    });

    return NextResponse.json({ success: true, appointmentId: String(appointment._id) });

  } catch (err) {
    console.error("[patient/appointments POST]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
