import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import dbConnect from "@/lib/db";
import PatientProfile from "@/models/PatientProfile";

export async function PATCH(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const prefs = await req.json() as {
      appointmentReminders?: boolean;
      bookingConfirmations?:  boolean;
      scheduleUpdates?:       boolean;
    };

    await dbConnect();

    const patch: Record<string, unknown> = {};
    if ("appointmentReminders" in prefs) patch["notificationPrefs.appointmentReminders"] = prefs.appointmentReminders;
    if ("bookingConfirmations"  in prefs) patch["notificationPrefs.bookingConfirmations"]  = prefs.bookingConfirmations;
    if ("scheduleUpdates"       in prefs) patch["notificationPrefs.scheduleUpdates"]       = prefs.scheduleUpdates;

    await PatientProfile.findOneAndUpdate(
      { userId: token.id },
      { $set: patch },
      { upsert: true }
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[account/notifications]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
