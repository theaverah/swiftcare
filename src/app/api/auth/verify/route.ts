import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";

export async function POST(req: NextRequest) {
  try {
    const { email, code } = await req.json();

    if (!email || !code) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    await dbConnect();

    const user = await User.findOne({ email }).select("+verificationCode +verificationExpires");

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.isVerified) {
      return NextResponse.json({ success: true }); // already verified, allow through
    }

    const devBypass = process.env.NODE_ENV === "development" && code === "123456";

    if (
      !devBypass && (
        user.verificationCode !== code ||
        !user.verificationExpires ||
        user.verificationExpires < new Date()
      )
    ) {
      return NextResponse.json({ error: "Invalid or expired code" }, { status: 400 });
    }

    user.isVerified          = true;
    user.verificationCode    = undefined;
    user.verificationExpires = undefined;
    await user.save();

    return NextResponse.json({ success: true });

  } catch (err) {
    console.error("[verify]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
