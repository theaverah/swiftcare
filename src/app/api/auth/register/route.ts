import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/db";
import User from "@/models/User";

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

    const existing = await User.findOne({ email }).select("+verificationCode +verificationExpires");

    if (existing) {
      if (existing.isVerified) {
        return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
      }
      // Unverified — refresh OTP so they can retry
      const otp = generateOTP();
      existing.verificationCode    = otp;
      existing.verificationExpires = new Date(Date.now() + 15 * 60 * 1000);
      await existing.save();
      console.log(`[SwiftCare] OTP for ${email}: ${otp}`);
      return NextResponse.json({ success: true });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const otp            = generateOTP();

    await User.create({
      email,
      password: hashedPassword,
      name: "",
      role,
      isVerified: false,
      verificationCode:    otp,
      verificationExpires: new Date(Date.now() + 15 * 60 * 1000),
    });

    console.log(`[SwiftCare] OTP for ${email}: ${otp}`);
    return NextResponse.json({ success: true }, { status: 201 });

  } catch (err) {
    console.error("[register]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
