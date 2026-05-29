import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import dbConnect from "@/lib/db";
import Appointment from "@/models/Appointment";
import User from "@/models/User";
import pusherServer from "@/lib/pusher-server";
import mongoose from "mongoose";

function parseSlotToDate(dateStr: string, slot: string): Date {
  const [time, ampm] = slot.split(" ");
  let [h, m] = time.split(":").map(Number);
  if (ampm === "PM" && h !== 12) h += 12;
  if (ampm === "AM" && h === 12) h = 0;
  const d = new Date(`${dateStr}T00:00:00`);
  d.setHours(h, m ?? 0, 0, 0);
  return d;
}

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const body = await req.json() as { date: string; assignedSlot: string };
    const { date, assignedSlot } = body;
    if (!date || !assignedSlot) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    await dbConnect();

    const appointment = await Appointment.findOne({
      _id: id,
      patientId: token.id,
      status: { $in: ["pending", "confirmed"] },
    });
    if (!appointment) return NextResponse.json({ error: "Appointment not found" }, { status: 404 });

    appointment.scheduledAt = parseSlotToDate(date, assignedSlot);
    appointment.status      = "confirmed";
    await appointment.save();

    try {
      const doctor = await User.findById(appointment.doctorId).select("name").lean();
      const doctorName = (doctor as { name?: string } | null)?.name ?? "your doctor";
      const dateLabel = new Date(date + "T12:00:00").toLocaleDateString("en-PH", {
        weekday: "long", month: "long", day: "numeric",
      });
      await pusherServer.trigger(`patient-${token.id}`, "appointment:rescheduled", {
        appointmentId: String(appointment._id),
        message: `Your consultation with Dr. ${doctorName} has been rescheduled to ${dateLabel} at ${assignedSlot}.`,
      });
    } catch { /* non-blocking */ }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[patient/appointments PATCH]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    await dbConnect();

    const appointment = await Appointment.findOne({
      _id: id,
      patientId: token.id,
      status: { $in: ["pending", "confirmed"] },
    });
    if (!appointment) return NextResponse.json({ error: "Appointment not found" }, { status: 404 });

    const doctorId   = appointment.doctorId;
    const scheduledAt = appointment.scheduledAt as Date;

    appointment.status      = "cancelled";
    appointment.cancelledBy = "patient";
    await appointment.save();

    try {
      const doctor = await User.findById(doctorId).select("name").lean();
      const doctorName = (doctor as { name?: string } | null)?.name ?? "your doctor";
      const dateLabel = scheduledAt.toLocaleDateString("en-PH", {
        weekday: "long", month: "long", day: "numeric",
      });
      await pusherServer.trigger(`patient-${token.id}`, "appointment:cancelled", {
        appointmentId: String(appointment._id),
        message: `Your consultation with Dr. ${doctorName} on ${dateLabel} has been cancelled.`,
      });
    } catch { /* non-blocking */ }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[patient/appointments DELETE]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
