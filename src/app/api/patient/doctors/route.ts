import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import DoctorProfile from "@/models/DoctorProfile";
import PatientProfile from "@/models/PatientProfile";

// -- Helpers -------------------------------------------------------------------

function parseHour(t: string): number {
  const [time, ampm] = t.split(" ");
  let [h] = time.split(":").map(Number);
  if (ampm === "PM" && h !== 12) h += 12;
  if (ampm === "AM" && h === 12) h = 0;
  return h;
}

const TIME_WINDOWS: Record<string, [number, number]> = {
  morning:   [6, 12],
  afternoon: [12, 18],
  evening:   [18, 22],
};

type AvailSlot = { dayOfWeek: number; startTime: string; endTime: string; isAvailable: boolean };

function nextAvailable(availability: AvailSlot[]) {
  const active = availability.filter(a => a.isAvailable);
  if (active.length === 0) return null;

  const today   = new Date();
  const todayDow = today.getDay();

  for (let offset = 0; offset <= 7; offset++) {
    const dow  = (todayDow + offset) % 7;
    const slot = active.find(a => a.dayOfWeek === dow);
    if (slot) {
      const d = new Date(today);
      d.setDate(today.getDate() + offset);
      return { date: d, isToday: offset === 0, startTime: slot.startTime, endTime: slot.endTime };
    }
  }
  return null;
}

// -- Route ---------------------------------------------------------------------

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await dbConnect();

    const { searchParams } = new URL(req.url);
    const search     = searchParams.get("search")?.toLowerCase() ?? "";
    const specialties = searchParams.get("specialties")?.split(",").filter(Boolean) ?? [];
    const languages  = searchParams.get("languages")?.split(",").filter(Boolean) ?? [];
    const timePref   = searchParams.get("timePref")?.split(",").filter(Boolean) ?? [];
    const maxFee     = searchParams.get("maxFee") ? Number(searchParams.get("maxFee")) : 0;

    // Saved doctor IDs for this patient
    const patientProfile = await PatientProfile.findOne({ userId: token.id }).select("savedDoctors");
    const savedIds = new Set((patientProfile?.savedDoctors ?? []).map(String));

    // All verified doctor users → name lookup map
    const doctorUsers = await User.find({ role: "doctor", isVerified: true }).select("_id name").lean();
    const userMap = new Map(doctorUsers.map(u => [String(u._id), u.name as string]));

    // Build DB-level filter
    const profileFilter: Record<string, unknown> = {
      isAcceptingPatients: true,
      specializations: { $exists: true, $not: { $size: 0 } },
    };
    if (specialties.length) profileFilter.specializations = { $in: specialties };
    if (languages.length)   profileFilter.languages       = { $in: languages };
    if (maxFee > 0)         profileFilter.consultationFee = { $lte: maxFee };

    let profiles = await DoctorProfile.find(profileFilter).lean();

    // In-memory filters that need computed data
    const todayDow = new Date().getDay();

    profiles = profiles.filter(p => {
      // Text search: name or specializations
      if (search) {
        const name  = (userMap.get(String(p.userId)) ?? "").toLowerCase();
        const specs = (p.specializations ?? []).join(" ").toLowerCase();
        if (!name.includes(search) && !specs.includes(search)) return false;
      }

      // Time preference: doctor must have at least one slot overlapping a requested window
      if (timePref.length > 0) {
        const windows = timePref
          .map(tp => TIME_WINDOWS[tp])
          .filter((w): w is [number, number] => !!w);

        const hasOverlap = p.availability.some(slot => {
          if (!slot.isAvailable) return false;
          const sh = parseHour(slot.startTime);
          const eh = parseHour(slot.endTime);
          return windows.some(([ws, we]) => sh < we && eh > ws);
        });

        if (!hasOverlap) return false;
      }

      return true;
    });

    // Shape response
    const doctors = profiles.map(p => {
      const next  = nextAvailable(p.availability);
      const label = next
        ? (() => {
            const datePart = next.isToday
              ? "Today"
              : next.date.toLocaleDateString("en-PH", { weekday: "long", month: "long", day: "numeric" });
            return `${datePart}, ${next.startTime} - ${next.endTime}`;
          })()
        : "Not currently available";

      return {
        doctorProfileId:    String(p._id),
        userId:             String(p.userId),
        name:               userMap.get(String(p.userId)) ?? "Unknown",
        profileImage:       p.profileImage ?? null,
        specializations:    p.specializations,
        consultationFee:    p.consultationFee ?? null,
        languages:          p.languages,
        yearsOfExperience:  p.yearsOfExperience ?? null,
        licenseNumber:      p.licenseNumber ?? null,
        bio:                p.bio ?? null,
        city:               p.city ?? null,
        education:          p.education ?? null,
        certifications:     p.certifications ?? [],
        affiliations:       p.affiliations ?? [],
        rating:             p.rating,
        totalReviews:       p.totalReviews,
        availability:       p.availability,
        nextAvailableLabel: label,
        isAvailableToday:   next?.isToday ?? false,
        todayHours:         next ? `${next.startTime} - ${next.endTime}` : null,
        isSaved:            savedIds.has(String(p.userId)),
      };
    });

    return NextResponse.json({ doctors });

  } catch (err) {
    console.error("[patient/doctors]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
