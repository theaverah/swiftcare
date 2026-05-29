import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import PendingRegistration from "@/models/PendingRegistration";

export async function POST(req: NextRequest) {
  try {
    const { email, code } = await req.json();

    if (!email || !code) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    await dbConnect();

    const pending = await PendingRegistration.findOne({ email: email.toLowerCase() });
    if (!pending) {
      return NextResponse.json({ error: "Registration not found. Please start over." }, { status: 404 });
    }

    const devBypass = process.env.NODE_ENV === "development" && code === "123456";

    if (
      !devBypass && (
        pending.otp !== code ||
        pending.otpExpires < new Date()
      )
    ) {
      return NextResponse.json({ error: "Invalid or expired code" }, { status: 400 });
    }

    return NextResponse.json({ success: true });

  } catch (err) {
    console.error("[verify]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
