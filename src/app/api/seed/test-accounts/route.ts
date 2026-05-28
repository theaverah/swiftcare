import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import PatientProfile from "@/models/PatientProfile";
import DoctorProfile from "@/models/DoctorProfile";
import type { DayOfWeek } from "@/models/DoctorProfile";

const PASSWORD = "Test1234!";

const SEED_DOCTORS = [
  {
    email:  "doctor@test.com",
    name:   "Maria Cristina Reyes",
    profile: {
      specializations:   ["General Practice", "Internal Medicine"],
      bio:               "Dr. Reyes is a board-certified internist with over 10 years of experience. She is committed to providing compassionate, evidence-based care to every patient.",
      licenseNumber:     "0012345",
      yearsOfExperience: 10,
      consultationFee:   500,
      languages:         ["English", "Filipino"],
      availability:      [1,2,3,4,5].map(d => ({ dayOfWeek: d as DayOfWeek, startTime: "8:00 AM", endTime: "5:00 PM", isAvailable: true })),
      rating: 4.8, totalReviews: 124,
    },
  },
  {
    email:  "santos@test.com",
    name:   "Jose Enrique Santos",
    profile: {
      specializations:   ["Cardiology"],
      bio:               "Dr. Santos is a cardiologist specializing in heart disease prevention and management. With 15 years of experience, he blends clinical expertise with a patient-centered approach.",
      licenseNumber:     "0023456",
      yearsOfExperience: 15,
      consultationFee:   1500,
      languages:         ["English", "Filipino"],
      availability:      [1,3,5].map(d => ({ dayOfWeek: d as DayOfWeek, startTime: "9:00 AM", endTime: "4:00 PM", isAvailable: true })),
      rating: 4.9, totalReviews: 210,
    },
  },
  {
    email:  "ramirez@test.com",
    name:   "Ana Sofia Ramirez",
    profile: {
      specializations:   ["Dermatology"],
      bio:               "Dr. Ramirez is a dermatologist with expertise in medical, surgical, and cosmetic dermatology. She helps patients achieve healthy skin through evidence-based treatment.",
      licenseNumber:     "0034567",
      yearsOfExperience: 8,
      consultationFee:   800,
      languages:         ["English", "Filipino", "Spanish"],
      availability:      [2,4].map(d => ({ dayOfWeek: d as DayOfWeek, startTime: "10:00 AM", endTime: "6:00 PM", isAvailable: true })),
      rating: 4.7, totalReviews: 88,
    },
  },
  {
    email:  "torres@test.com",
    name:   "Michael James Torres",
    profile: {
      specializations:   ["Pediatrics"],
      bio:               "Dr. Torres is a pediatrician dedicated to the health and wellbeing of children from newborns to adolescents. He creates a warm and friendly environment for young patients.",
      licenseNumber:     "0045678",
      yearsOfExperience: 12,
      consultationFee:   600,
      languages:         ["English", "Filipino", "Cebuano"],
      availability:      [1,2,3,4,5].map(d => ({ dayOfWeek: d as DayOfWeek, startTime: "8:00 AM", endTime: "4:00 PM", isAvailable: true })),
      rating: 4.9, totalReviews: 302,
    },
  },
  {
    email:  "villanueva@test.com",
    name:   "Elena Grace Villanueva",
    profile: {
      specializations:   ["Obstetrics & Gynecology"],
      bio:               "Dr. Villanueva provides comprehensive women's health care from adolescence through menopause. She specializes in prenatal care, reproductive health, and minimally invasive procedures.",
      licenseNumber:     "0056789",
      yearsOfExperience: 14,
      consultationFee:   1200,
      languages:         ["English", "Filipino"],
      availability:      [1,2,4,5].map(d => ({ dayOfWeek: d as DayOfWeek, startTime: "9:00 AM", endTime: "5:00 PM", isAvailable: true })),
      rating: 4.8, totalReviews: 176,
    },
  },
  {
    email:  "cruz@test.com",
    name:   "Roberto Manuel Cruz",
    profile: {
      specializations:   ["Orthopedic Surgery", "Sports Medicine"],
      bio:               "Dr. Cruz is an orthopedic surgeon specializing in joint replacement and sports injuries. He has treated athletes and active patients for over 18 years.",
      licenseNumber:     "0067890",
      yearsOfExperience: 18,
      consultationFee:   1800,
      languages:         ["English", "Filipino"],
      availability:      [2,3,5].map(d => ({ dayOfWeek: d as DayOfWeek, startTime: "7:00 AM", endTime: "3:00 PM", isAvailable: true })),
      rating: 4.7, totalReviews: 143,
    },
  },
  {
    email:  "lim@test.com",
    name:   "Sophia Mae Lim",
    profile: {
      specializations:   ["Psychiatry", "Mental Health"],
      bio:               "Dr. Lim is a psychiatrist who believes mental health is the foundation of overall wellbeing. She offers a safe, non-judgmental space for patients dealing with anxiety, depression, and other mental health challenges.",
      licenseNumber:     "0078901",
      yearsOfExperience: 9,
      consultationFee:   1000,
      languages:         ["English", "Filipino", "Mandarin"],
      availability:      [1,3,4].map(d => ({ dayOfWeek: d as DayOfWeek, startTime: "2:00 PM", endTime: "8:00 PM", isAvailable: true })),
      rating: 5.0, totalReviews: 95,
    },
  },
];

export async function GET() {
  try {
    await dbConnect();

    const hashedPassword = await bcrypt.hash(PASSWORD, 12);
    const results: Record<string, string> = {};

    // ── Patient ───────────────────────────────────────────────────────────────
    let patient = await User.findOne({ email: "patient@test.com" });
    if (!patient) {
      patient = await User.create({
        email: "patient@test.com", password: hashedPassword,
        name: "Alex Rivera", role: "patient", isVerified: true,
      });
      await PatientProfile.create({
        userId: patient._id, dateOfBirth: new Date("1995-03-14"),
        phone: "+639171234567", weight: 68, height: 170, bloodType: "O+",
        allergies: ["Penicillin"], currentMedications: [], medicalHistory: "No significant past medical history",
      });
      results.patient = "created";
    } else {
      results.patient = "already exists";
    }

    // ── Doctors ───────────────────────────────────────────────────────────────
    for (const seed of SEED_DOCTORS) {
      let user = await User.findOne({ email: seed.email });
      if (!user) {
        user = await User.create({
          email: seed.email, password: hashedPassword,
          name: seed.name, role: "doctor", isVerified: true,
        });
        await DoctorProfile.create({ userId: user._id, ...seed.profile, isAcceptingPatients: true });
        results[seed.email] = "created";
      } else {
        results[seed.email] = "already exists";
      }
    }

    return NextResponse.json({
      success: true, results,
      credentials: {
        patient: { email: "patient@test.com", password: PASSWORD },
        doctor:  { email: "doctor@test.com",  password: PASSWORD },
      },
    });

  } catch (err) {
    console.error("[seed/test-accounts]", err);
    return NextResponse.json({ error: "Seed failed", detail: String(err) }, { status: 500 });
  }
}
