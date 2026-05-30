import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import PatientProfile from "@/models/PatientProfile";
import PendingRegistration from "@/models/PendingRegistration";

// -- GET — fetch full profile ---------------------------------------------------

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await dbConnect();

    const [user, profile] = await Promise.all([
      User.findById(token.id).select("name email").lean(),
      PatientProfile.findOne({ userId: token.id }).lean(),
    ]);

    return NextResponse.json({
      name:               (user as { name?: string } | null)?.name ?? "",
      email:              (user as { email?: string } | null)?.email ?? "",
      dateOfBirth:        profile?.dateOfBirth ?? null,
      phone:              profile?.phone ?? "",
      weight:             profile?.weight ?? null,
      height:             profile?.height ?? null,
      bloodType:          profile?.bloodType ?? "",
      allergies:          profile?.allergies ?? [],
      currentMedications: profile?.currentMedications ?? [],
      medicalHistory:     profile?.medicalHistory ?? "",
      notificationPrefs:  profile?.notificationPrefs ?? {
        appointmentReminders: true,
        bookingConfirmations:  true,
        scheduleUpdates:       true,
      },
    });
  } catch (err) {
    console.error("[patient/profile GET]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// -- PATCH — update personal or health fields ----------------------------------

export async function PATCH(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json() as Record<string, unknown>;
    await dbConnect();

    const profilePatch: Record<string, unknown> = {};
    const userPatch:    Record<string, unknown> = {};

    if ("name"       in body) userPatch.name = body.name;
    if ("dateOfBirth"in body) profilePatch.dateOfBirth = body.dateOfBirth ? new Date(body.dateOfBirth as string) : undefined;
    if ("phone"      in body) profilePatch.phone       = body.phone;
    if ("weight"     in body) profilePatch.weight      = body.weight ? Number(body.weight) : undefined;
    if ("height"     in body) profilePatch.height      = body.height ? Number(body.height) : undefined;
    if ("allergies"  in body) profilePatch.allergies   = body.allergies;
    if ("currentMedications" in body) profilePatch.currentMedications = body.currentMedications;
    if ("medicalHistory"     in body) profilePatch.medicalHistory     = body.medicalHistory;

    await Promise.all([
      Object.keys(userPatch).length    ? User.findByIdAndUpdate(token.id, userPatch) : null,
      Object.keys(profilePatch).length ? PatientProfile.findOneAndUpdate({ userId: token.id }, profilePatch, { upsert: true }) : null,
    ]);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[patient/profile PATCH]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const body = await req.json();
    const {
      firstName, lastName, birthday, contactNumber,
      weight, height, conditions, allergies, medications,
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
          role:       "patient",
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

    await PatientProfile.findOneAndUpdate(
      { userId },
      {
        userId,
        dateOfBirth:        birthday ? new Date(birthday) : undefined,
        phone:              contactNumber ? `+63${contactNumber}` : undefined,
        weight:             weight  ? parseFloat(weight)  : undefined,
        height:             height  ? parseFloat(height)  : undefined,
        allergies:          allergies ?? [],
        currentMedications: medications ?? [],
        medicalHistory:     conditions?.length ? conditions.join(", ") : undefined,
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({ success: true });

  } catch (err) {
    console.error("[patient/profile]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
