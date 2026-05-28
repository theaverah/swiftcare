import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import DoctorProfile from "@/models/DoctorProfile";
import PatientProfile from "@/models/PatientProfile";

function nextAvailableDate(availability: { dayOfWeek: number; startTime: string; endTime: string; isAvailable: boolean }[]) {
  const available = availability.filter(a => a.isAvailable).map(a => a.dayOfWeek);
  if (available.length === 0) return null;

  const today = new Date();
  const todayDow = today.getDay();

  for (let offset = 0; offset <= 7; offset++) {
    const dow = (todayDow + offset) % 7;
    if (available.includes(dow)) {
      const d = new Date(today);
      d.setDate(today.getDate() + offset);
      return { date: d, isToday: offset === 0 };
    }
  }
  return null;
}

function todayHours(availability: { dayOfWeek: number; startTime: string; endTime: string; isAvailable: boolean }[]) {
  const todayDow = new Date().getDay();
  const slot = availability.find(a => a.dayOfWeek === todayDow && a.isAvailable);
  if (!slot) return null;
  return `${slot.startTime} – ${slot.endTime}`;
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await dbConnect();

    const { searchParams } = new URL(req.url);
    const search       = searchParams.get("search")?.toLowerCase() ?? "";
    const speciality   = searchParams.get("speciality") ?? "";
    const language     = searchParams.get("language") ?? "";
    const feeRange     = searchParams.get("feeRange") ?? "";
    const availability = searchParams.get("availability") ?? "";
    const timeOfDay    = searchParams.get("timeOfDay") ?? "";

    // Get patient's saved doctors
    const patientProfile = await PatientProfile.findOne({ userId: session.user.id }).select("savedDoctors");
    const savedIds = new Set((patientProfile?.savedDoctors ?? []).map(String));

    // Get all verified doctor users
    const doctorUsers = await User.find({ role: "doctor", isVerified: true }).select("_id name").lean();
    const userMap = new Map(doctorUsers.map(u => [String(u._id), u.name as string]));

    // Query doctor profiles
    const profileFilter: Record<string, unknown> = { isAcceptingPatients: true };
    if (speciality) profileFilter.specializations = { $in: [speciality] };
    if (language)   profileFilter.languages = { $in: [language] };

    if (feeRange) {
      if (feeRange === "under500")        profileFilter.consultationFee = { $lt: 500 };
      else if (feeRange === "500-1000")   profileFilter.consultationFee = { $gte: 500, $lte: 1000 };
      else if (feeRange === "1000-2000")  profileFilter.consultationFee = { $gt: 1000, $lte: 2000 };
      else if (feeRange === "2000plus")   profileFilter.consultationFee = { $gt: 2000 };
    }

    let profiles = await DoctorProfile.find(profileFilter).lean();

    // Client-side filters that need computed data
    const todayDow = new Date().getDay();

    profiles = profiles.filter(p => {
      const name = (userMap.get(String(p.userId)) ?? "").toLowerCase();
      const specs = p.specializations.map(s => s.toLowerCase()).join(" ");
      if (search && !name.includes(search) && !specs.includes(search)) return false;

      if (availability === "today") {
        const hasToday = p.availability.some(a => a.dayOfWeek === todayDow && a.isAvailable);
        if (!hasToday) return false;
      }
      if (availability === "week") {
        const thisWeek = [0,1,2,3,4,5,6].slice(0, 7);
        const hasThisWeek = p.availability.some(a => thisWeek.includes(a.dayOfWeek) && a.isAvailable);
        if (!hasThisWeek) return false;
      }

      if (timeOfDay) {
        const todaySlot = p.availability.find(a => a.dayOfWeek === todayDow && a.isAvailable);
        if (!todaySlot) return false;
        const startHour = parseInt(todaySlot.startTime);
        if (timeOfDay === "morning"   && (startHour < 6  || startHour >= 12)) return false;
        if (timeOfDay === "afternoon" && (startHour < 12 || startHour >= 18)) return false;
        if (timeOfDay === "evening"   && (startHour < 18 || startHour >= 22)) return false;
      }

      return true;
    });

    const doctors = profiles.map(p => {
      const next    = nextAvailableDate(p.availability);
      const hours   = todayHours(p.availability);
      const dateStr = next
        ? next.isToday
          ? "Available today"
          : `Next available: ${next.date.toLocaleDateString("en-PH", { weekday: "long", month: "long", day: "numeric" })}`
        : "Not currently available";

      return {
        doctorProfileId:   String(p._id),
        userId:            String(p.userId),
        name:              userMap.get(String(p.userId)) ?? "Unknown",
        profileImage:      p.profileImage ?? null,
        specializations:   p.specializations,
        consultationFee:   p.consultationFee ?? null,
        languages:         p.languages,
        yearsOfExperience: p.yearsOfExperience ?? null,
        licenseNumber:     p.licenseNumber ?? null,
        bio:               p.bio ?? null,
        rating:            p.rating,
        totalReviews:      p.totalReviews,
        availability:      p.availability,
        nextAvailableLabel: dateStr,
        isAvailableToday:  next?.isToday ?? false,
        todayHours:        hours,
        isSaved:           savedIds.has(String(p.userId)),
      };
    });

    return NextResponse.json({ doctors });

  } catch (err) {
    console.error("[patient/doctors]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
