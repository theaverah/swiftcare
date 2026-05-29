import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import PendingRegistration from "@/models/PendingRegistration";

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: NextRequest) {
  try {
    const { email, password, role } = await req.json();

    if (!email || !password || !role) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    await dbConnect();

    // Block if a fully-registered account already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const otp            = generateOTP();
    const otpExpires     = new Date(Date.now() + 15 * 60 * 1000);

    // Upsert PendingRegistration — refreshes OTP if they retry
    await PendingRegistration.findOneAndUpdate(
      { email: email.toLowerCase() },
      { password: hashedPassword, role, otp, otpExpires },
      { upsert: true, new: true }
    );

    console.log(`[SwiftCare] OTP for ${email}: ${otp}`);
    return NextResponse.json({ success: true }, { status: 201 });

  } catch (err) {
    console.error("[register]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
