import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import dbConnect from "@/lib/db";
import Notification from "@/models/Notification";

// GET — fetch all notifications for the logged-in patient
export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await dbConnect();

    const docs = await Notification.find({ userId: token.id })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const notifications = docs.map(d => ({
      id:        String(d._id),
      type:      d.type,
      title:     d.title,
      message:   d.message,
      href:      "/patient/consultations",
      timestamp: (d.createdAt as Date).toISOString(),
      read:      d.isRead,
    }));

    return NextResponse.json({ notifications });
  } catch (err) {
    console.error("[notifications GET]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// PATCH — mark one or all notifications as read
export async function PATCH(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await dbConnect();

    const body = await req.json() as { id?: string; all?: boolean };

    if (body.all) {
      await Notification.updateMany({ userId: token.id, isRead: false }, { isRead: true });
    } else if (body.id) {
      await Notification.updateOne({ _id: body.id, userId: token.id }, { isRead: true });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[notifications PATCH]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
