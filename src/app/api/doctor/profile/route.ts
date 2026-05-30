import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import DoctorProfile from "@/models/DoctorProfile";
import PendingRegistration from "@/models/PendingRegistration";

const DAY_TO_NUM: Record<string, number> = {
  Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
};
const NUM_TO_DAY: Record<number, string> = {
  0: "Sun", 1: "Mon", 2: "Tue", 3: "Wed", 4: "Thu", 5: "Fri", 6: "Sat",
};
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await dbConnect();
    const [user, profile] = await Promise.all([
      User.findById(token.id).select("name email").lean() as Promise<{ name: string; email: string } | null>,
      DoctorProfile.findOne({ userId: token.id })
        .select("specializations bio profileImage consultationFee yearsOfExperience languages licenseNumber contactNumber education certifications affiliations availability notificationPrefs")
        .lean() as Promise<{
          specializations?: string[];
          bio?: string;
          profileImage?: string;
          consultationFee?: number;
          yearsOfExperience?: number;
          languages?: string[];
          licenseNumber?: string;
          contactNumber?: string;
          education?: { medicalSchool: string; residency: string };
          certifications?: string[];
          affiliations?: string[];
          availability?: { dayOfWeek: number; startTime: string; endTime: string; isAvailable: boolean }[];
          notificationPrefs?: { appointmentReminders: boolean; bookingConfirmations: boolean; scheduleUpdates: boolean };
        } | null>,
    ]);

    // Convert availability array → schedule Record
    const schedule = Object.fromEntries(
      DAYS.map((d) => {
        const num  = DAY_TO_NUM[d];
        const slot = profile?.availability?.find((a) => a.dayOfWeek === num && a.isAvailable);
        return [d, {
          enabled:   !!slot,
          startTime: slot?.startTime ?? "8:00 AM",
          endTime:   slot?.endTime   ?? "5:00 PM",
          breaks:    [] as { startTime: string; endTime: string }[],
        }];
      })
    );

    return NextResponse.json({
      name:             user?.name ?? "",
      email:            user?.email ?? "",
      contactNumber:    profile?.contactNumber    ?? "",
      profileImage:     profile?.profileImage     ?? null,
      specializations:  profile?.specializations  ?? [],
      prcLicense:       profile?.licenseNumber    ?? "",
      yearsOfExperience: profile?.yearsOfExperience != null ? String(profile.yearsOfExperience) : "",
      bio:              profile?.bio              ?? "",
      languages:        profile?.languages        ?? ["English"],
      education:        profile?.education        ?? { medicalSchool: "", residency: "" },
      certifications:   profile?.certifications   ?? [],
      affiliations:     profile?.affiliations     ?? [],
      consultationFee:  profile?.consultationFee  != null ? String(profile.consultationFee) : "",
      schedule,
      notificationPrefs: profile?.notificationPrefs ?? {
        appointmentReminders: true,
        bookingConfirmations:  true,
        scheduleUpdates:       true,
      },
    });
  } catch (err) {
    console.error("[doctor/profile GET]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json() as {
      name?: string;
      contactNumber?: string;
      profileImage?: string | null;
      specializations?: string[];
      prcLicense?: string;
      yearsOfExperience?: string;
      bio?: string;
      languages?: string[];
      education?: { medicalSchool: string; residency: string };
      certifications?: string[];
      affiliations?: string[];
      consultationFee?: string;
      schedule?: Record<string, { enabled: boolean; startTime: string; endTime: string }>;
    };

    await dbConnect();

    if (body.name?.trim()) {
      await User.findByIdAndUpdate(token.id, { name: body.name.trim() });
    }

    const availability = body.schedule
      ? Object.entries(body.schedule)
          .filter(([, d]) => d.enabled)
          .map(([day, d]) => ({
            dayOfWeek:   DAY_TO_NUM[day] ?? 1,
            startTime:   d.startTime,
            endTime:     d.endTime,
            isAvailable: true,
          }))
      : undefined;

    const update: Record<string, unknown> = {};
    if (body.contactNumber    !== undefined) update.contactNumber    = body.contactNumber;
    if (body.profileImage     !== undefined) update.profileImage     = body.profileImage || undefined;
    if (body.specializations  !== undefined) update.specializations  = body.specializations;
    if (body.prcLicense       !== undefined) update.licenseNumber    = body.prcLicense;
    if (body.yearsOfExperience !== undefined) update.yearsOfExperience = body.yearsOfExperience ? parseInt(body.yearsOfExperience) : undefined;
    if (body.bio              !== undefined) update.bio              = body.bio;
    if (body.languages        !== undefined) update.languages        = body.languages?.length ? body.languages : ["English"];
    if (body.education        !== undefined) update.education        = (body.education?.medicalSchool || body.education?.residency) ? body.education : undefined;
    if (body.certifications   !== undefined) update.certifications   = body.certifications;
    if (body.affiliations     !== undefined) update.affiliations     = body.affiliations;
    if (body.consultationFee  !== undefined) update.consultationFee  = body.consultationFee ? parseFloat(body.consultationFee) : undefined;
    if (availability          !== undefined) update.availability     = availability;

    await DoctorProfile.findOneAndUpdate(
      { userId: token.id },
      update,
      { upsert: true, new: true }
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[doctor/profile PATCH]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const body = await req.json();
    const {
      firstName, lastName,
      profileImage, specializations, prcLicense, yearsOfExperience,
      languages, bio, consultationFee, schedule,
      pendingEmail,
    } = body;

    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    let userId: string;

    if (!token?.id) {
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
    console.error("[doctor/profile POST]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// Suppress unused import warning — NUM_TO_DAY used for future expansion
void NUM_TO_DAY;
