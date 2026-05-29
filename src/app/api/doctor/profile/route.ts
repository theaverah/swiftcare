import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import DoctorProfile from "@/models/DoctorProfile";
import PendingRegistration from "@/models/PendingRegistration";

const DAY_TO_NUM: Record<string, number> = {
  Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
};

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const body = await req.json();
    const {
      firstName, lastName,
      profileImage, specializations, prcLicense, yearsOfExperience,
      languages, bio, consultationFee, schedule,
      pendingEmail, // present only during new registration
    } = body;

    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    let userId: string;

    if (!token?.id) {
      // New registration — create User from PendingRegistration
      if (!pendingEmail) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const pending = await PendingRegistration.findOne({ email: pendingEmail.toLowerCase() });
      if (!pending) {
        return NextResponse.json(
          { error: "Registration session expired. Please register again." },
          { status: 404 }
        );
      }

      const fullName = `${firstName} ${lastName}`.trim();

      // Idempotent — don't double-create if they retry
      let user = await User.findOne({ email: pending.email });
      if (!user) {
        user = await User.create({
          email:      pending.email,
          password:   pending.password,
          name:       fullName,
          role:       "doctor",
          isVerified: true,
        });
      } else {
        await User.findByIdAndUpdate(user._id, { name: fullName });
      }

      await PendingRegistration.deleteOne({ email: pending.email });
      userId = String(user._id);
    } else {
      userId = token.id;
      const fullName = `${firstName} ${lastName}`.trim();
      await User.findByIdAndUpdate(userId, { name: fullName });
    }

    const availability = Object.entries(
      schedule as Record<string, { enabled: boolean; startTime: string; endTime: string }>
    )
      .filter(([, day]) => day.enabled)
      .map(([dayName, day]) => ({
        dayOfWeek:   DAY_TO_NUM[dayName] ?? 1,
        startTime:   day.startTime,
        endTime:     day.endTime,
        isAvailable: true,
      }));

    await DoctorProfile.findOneAndUpdate(
      { userId },
      {
        userId,
        specializations:   specializations ?? [],
        bio:               bio || undefined,
        profileImage:      profileImage || undefined,
        licenseNumber:     prcLicense || undefined,
        yearsOfExperience: yearsOfExperience ? parseInt(yearsOfExperience) : undefined,
        consultationFee:   consultationFee ? parseFloat(consultationFee) : undefined,
        languages:         languages?.length ? languages : ["English"],
        availability,
        isAcceptingPatients: true,
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({ success: true });

  } catch (err) {
    console.error("[doctor/profile]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
