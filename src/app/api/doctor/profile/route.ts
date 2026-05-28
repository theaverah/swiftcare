import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import DoctorProfile from "@/models/DoctorProfile";

const DAY_TO_NUM: Record<string, number> = {
  Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
};

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      firstName, lastName, birthday: _birthday, contactNumber: _contact,
      profileImage, specializations, prcLicense, yearsOfExperience,
      languages, bio, consultationFee, schedule,
    } = body;

    await dbConnect();

    const fullName = `${firstName} ${lastName}`.trim();
    await User.findByIdAndUpdate(token.id, { name: fullName });

    const availability = Object.entries(schedule as Record<string, { enabled: boolean; startTime: string; endTime: string }>)
      .filter(([, day]) => day.enabled)
      .map(([dayName, day]) => ({
        dayOfWeek:   DAY_TO_NUM[dayName] ?? 1,
        startTime:   day.startTime,
        endTime:     day.endTime,
        isAvailable: true,
      }));

    await DoctorProfile.findOneAndUpdate(
      { userId: token.id },
      {
        userId:           token.id,
        specializations:  specializations ?? [],
        bio:              bio || undefined,
        profileImage:     profileImage || undefined,
        licenseNumber:    prcLicense || undefined,
        yearsOfExperience: yearsOfExperience ? parseInt(yearsOfExperience) : undefined,
        consultationFee:  consultationFee ? parseFloat(consultationFee) : undefined,
        languages:        languages?.length ? languages : ["English"],
        availability,
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({ success: true });

  } catch (err) {
    console.error("[doctor/profile]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
