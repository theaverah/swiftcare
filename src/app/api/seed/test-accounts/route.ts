import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import PatientProfile from "@/models/PatientProfile";
import DoctorProfile from "@/models/DoctorProfile";
import type { DayOfWeek } from "@/models/DoctorProfile";

const PASSWORD = "Test1234!";

function days(dows: number[], start: string, end: string) {
  return dows.map(d => ({ dayOfWeek: d as DayOfWeek, startTime: start, endTime: end, isAvailable: true }));
}

const SEED_DOCTORS = [
  // ── Original 7 ───────────────────────────────────────────────────────────────
  {
    email: "doctor@test.com",
    name:  "Maria Cristina Reyes",
    profile: {
      specializations:   ["General Practice", "Internal Medicine"],
      bio:               "Dr. Reyes is a board-certified internist with over 10 years of experience. She is committed to providing compassionate, evidence-based care to every patient.",
      licenseNumber:     "0012345",
      yearsOfExperience: 10,
      consultationFee:   500,
      languages:         ["English", "Filipino (Tagalog)"],
      availability:      days([1,2,3,4,5], "8:00 AM", "5:00 PM"),
      rating: 4.8, totalReviews: 124,
    },
  },
  {
    email: "santos@test.com",
    name:  "Jose Enrique Santos",
    profile: {
      specializations:   ["Cardiology"],
      bio:               "Dr. Santos is a cardiologist specializing in heart disease prevention and management. With 15 years of experience, he blends clinical expertise with a patient-centered approach.",
      licenseNumber:     "0023456",
      yearsOfExperience: 15,
      consultationFee:   1500,
      languages:         ["English", "Filipino (Tagalog)"],
      availability:      days([1,3,5], "9:00 AM", "4:00 PM"),
      rating: 4.9, totalReviews: 210,
    },
  },
  {
    email: "ramirez@test.com",
    name:  "Ana Sofia Ramirez",
    profile: {
      specializations:   ["Dermatology"],
      bio:               "Dr. Ramirez is a dermatologist with expertise in medical, surgical, and cosmetic dermatology. She helps patients achieve healthy skin through evidence-based treatment.",
      licenseNumber:     "0034567",
      yearsOfExperience: 8,
      consultationFee:   800,
      languages:         ["English", "Filipino (Tagalog)", "Ilocano"],
      availability:      days([2,4], "10:00 AM", "6:00 PM"),
      rating: 4.7, totalReviews: 88,
    },
  },
  {
    email: "torres@test.com",
    name:  "Michael James Torres",
    profile: {
      specializations:   ["Pediatrics"],
      bio:               "Dr. Torres is a pediatrician dedicated to the health and wellbeing of children from newborns to adolescents. He creates a warm and friendly environment for young patients.",
      licenseNumber:     "0045678",
      yearsOfExperience: 12,
      consultationFee:   600,
      languages:         ["English", "Filipino (Tagalog)", "Cebuano (Bisaya)"],
      availability:      days([1,2,3,4,5], "8:00 AM", "4:00 PM"),
      rating: 4.9, totalReviews: 302,
    },
  },
  {
    email: "villanueva@test.com",
    name:  "Elena Grace Villanueva",
    profile: {
      specializations:   ["Obstetrics & Gynecology"],
      bio:               "Dr. Villanueva provides comprehensive women's health care from adolescence through menopause. She specializes in prenatal care, reproductive health, and minimally invasive procedures.",
      licenseNumber:     "0056789",
      yearsOfExperience: 14,
      consultationFee:   1200,
      languages:         ["English", "Filipino (Tagalog)"],
      availability:      days([1,2,4,5], "9:00 AM", "5:00 PM"),
      rating: 4.8, totalReviews: 176,
    },
  },
  {
    email: "cruz@test.com",
    name:  "Roberto Manuel Cruz",
    profile: {
      specializations:   ["Orthopedic Surgery", "Sports Medicine"],
      bio:               "Dr. Cruz is an orthopedic surgeon specializing in joint replacement and sports injuries. He has treated athletes and active patients for over 18 years.",
      licenseNumber:     "0067890",
      yearsOfExperience: 18,
      consultationFee:   1800,
      languages:         ["English", "Filipino (Tagalog)"],
      availability:      days([2,3,5], "7:00 AM", "3:00 PM"),
      rating: 4.7, totalReviews: 143,
    },
  },
  {
    email: "lim@test.com",
    name:  "Sophia Mae Lim",
    profile: {
      specializations:   ["Psychiatry", "Mental Health"],
      bio:               "Dr. Lim is a psychiatrist who believes mental health is the foundation of overall wellbeing. She offers a safe, non-judgmental space for patients dealing with anxiety, depression, and other mental health challenges.",
      licenseNumber:     "0078901",
      yearsOfExperience: 9,
      consultationFee:   1000,
      languages:         ["English", "Filipino (Tagalog)", "Kapampangan"],
      availability:      days([1,3,4], "2:00 PM", "8:00 PM"),
      rating: 5.0, totalReviews: 95,
    },
  },

  // ── 13 new doctors ────────────────────────────────────────────────────────────
  {
    email: "neurologist@test.com",
    name:  "Maribel Santos-Gonzalez",
    profile: {
      specializations:   ["Neurology"],
      bio:               "Dr. Santos-Gonzalez is a board-certified neurologist specializing in headache disorders, epilepsy, and stroke management. With 11 years of clinical experience at St. Luke's Medical Center and Philippine General Hospital, she brings evidence-based, compassionate care to complex neurological conditions.",
      licenseNumber:     "0089012",
      yearsOfExperience: 11,
      consultationFee:   2500,
      languages:         ["English", "Filipino (Tagalog)"],
      availability:      days([1,3,4,5], "9:00 AM", "5:00 PM"),
      rating: 4.8, totalReviews: 112,
    },
  },
  {
    email: "emergency@test.com",
    name:  "Francisco Dela Peña",
    profile: {
      specializations:   ["Emergency Medicine"],
      bio:               "Dr. Dela Peña is an emergency medicine specialist with 8 years of experience in high-acuity care environments. Trained at Philippine General Hospital and certified in Advanced Trauma Life Support (ATLS), he is committed to delivering fast, accurate, and accessible emergency care.",
      licenseNumber:     "0090123",
      yearsOfExperience: 8,
      consultationFee:   800,
      languages:         ["English", "Filipino (Tagalog)", "Cebuano (Bisaya)"],
      availability:      days([1,2,3,4,5], "8:00 AM", "8:00 PM"),
      rating: 4.7, totalReviews: 201,
    },
  },
  {
    email: "endocrine@test.com",
    name:  "Carmela Bustamante",
    profile: {
      specializations:   ["Endocrinology"],
      bio:               "Dr. Bustamante is a Fellow of the Philippine Society of Endocrinology, Diabetes, and Metabolism, specializing in diabetes management, thyroid disorders, and hormonal imbalances. With 13 years of practice, she emphasizes patient education and lifestyle intervention as pillars of effective endocrine care.",
      licenseNumber:     "0101234",
      yearsOfExperience: 13,
      consultationFee:   1800,
      languages:         ["English", "Filipino (Tagalog)"],
      availability:      days([2,5,6], "9:00 AM", "5:00 PM"),
      rating: 4.9, totalReviews: 87,
    },
  },
  {
    email: "eyes@test.com",
    name:  "Patricia Aquino",
    profile: {
      specializations:   ["Ophthalmology"],
      bio:               "Dr. Aquino is a comprehensive ophthalmologist with expertise in cataract surgery, glaucoma management, and diabetic retinopathy. She completed her residency at Philippine General Hospital and fellowship at the Asian Eye Institute, and has been in clinical practice for over 9 years.",
      licenseNumber:     "0112345",
      yearsOfExperience: 9,
      consultationFee:   1200,
      languages:         ["English", "Filipino (Tagalog)", "Waray"],
      availability:      days([1,3,5], "10:00 AM", "5:00 PM"),
      rating: 4.8, totalReviews: 143,
    },
  },
  {
    email: "rheuma@test.com",
    name:  "Rowena Castillo",
    profile: {
      specializations:   ["Rheumatology"],
      bio:               "Dr. Castillo is a Fellow of the Philippine Rheumatology Association with 16 years of experience managing autoimmune conditions including lupus, rheumatoid arthritis, and gout. She is known for her systematic approach to early diagnosis and her strong advocacy for long-term patient monitoring.",
      licenseNumber:     "0123456",
      yearsOfExperience: 16,
      consultationFee:   2200,
      languages:         ["English", "Filipino (Tagalog)"],
      availability:      days([2,4], "1:00 PM", "7:00 PM"),
      rating: 4.7, totalReviews: 76,
    },
  },
  {
    email: "nephro@test.com",
    name:  "Danilo Mercado",
    profile: {
      specializations:   ["Nephrology"],
      bio:               "Dr. Mercado is a nephrologist with 13 years of experience in chronic kidney disease, hypertension management, and dialysis care. Affiliated with multiple dialysis centers in Metro Manila, he is dedicated to slowing kidney disease progression through precision medicine and early intervention.",
      licenseNumber:     "0134567",
      yearsOfExperience: 13,
      consultationFee:   3000,
      languages:         ["English", "Filipino (Tagalog)"],
      availability:      days([1,3,5], "8:00 AM", "4:00 PM"),
      rating: 4.9, totalReviews: 164,
    },
  },
  {
    email: "pulmo@test.com",
    name:  "Lourdes Bautista",
    profile: {
      specializations:   ["Pulmonology"],
      bio:               "Dr. Bautista is a pulmonologist specializing in asthma, COPD, tuberculosis, and community-acquired pneumonia. A graduate of the University of the Philippines College of Medicine, she is a Fellow of the Philippine College of Chest Physicians with 10 years of clinical practice.",
      licenseNumber:     "0145678",
      yearsOfExperience: 10,
      consultationFee:   1500,
      languages:         ["English", "Filipino (Tagalog)"],
      availability:      days([1,2,5,6], "8:00 AM", "5:00 PM"),
      rating: 4.8, totalReviews: 98,
    },
  },
  {
    email: "gastro@test.com",
    name:  "Eduardo Mendoza",
    profile: {
      specializations:   ["Gastroenterology"],
      bio:               "Dr. Mendoza is a gastroenterologist and hepatologist with 12 years of experience in endoscopy, colonoscopy, and liver disease management. Trained at UP-PGH and affiliated with Makati Medical Center, he is recognized for his thorough approach to gastrointestinal diagnostics.",
      licenseNumber:     "0156789",
      yearsOfExperience: 12,
      consultationFee:   2000,
      languages:         ["English", "Filipino (Tagalog)"],
      availability:      days([1,2,3,5], "9:00 AM", "6:00 PM"),
      rating: 4.9, totalReviews: 187,
    },
  },
  {
    email: "family@test.com",
    name:  "Corazon Flores",
    profile: {
      specializations:   ["Family Medicine", "General Practice"],
      bio:               "Dr. Flores is a family medicine specialist providing comprehensive, patient-centered care for individuals of all ages. With 7 years of practice, she focuses on preventive care, chronic disease management, and building lasting doctor-patient relationships across generations.",
      licenseNumber:     "0167890",
      yearsOfExperience: 7,
      consultationFee:   400,
      languages:         ["English", "Filipino (Tagalog)", "Cebuano (Bisaya)"],
      availability:      days([1,2,3,4,5,6], "7:00 AM", "7:00 PM"),
      rating: 5.0, totalReviews: 342,
    },
  },
  {
    email: "uro@test.com",
    name:  "Antonio Ramos",
    profile: {
      specializations:   ["Urology"],
      bio:               "Dr. Ramos is a board-certified urologist with 18 years of experience in kidney stone management, prostate health, urinary tract disorders, and minimally invasive surgical procedures. He has trained and practiced at top medical institutions across Metro Manila.",
      licenseNumber:     "0178901",
      yearsOfExperience: 18,
      consultationFee:   2800,
      languages:         ["English", "Filipino (Tagalog)"],
      availability:      days([1,3,5,6], "8:00 AM", "4:00 PM"),
      rating: 4.7, totalReviews: 156,
    },
  },
  {
    email: "infectious@test.com",
    name:  "Maricel Santiago",
    profile: {
      specializations:   ["Infectious Disease"],
      bio:               "Dr. Santiago is an infectious disease specialist with a background in HIV medicine, tropical infections, and antimicrobial stewardship. A Fellow of the Philippine Society for Microbiology and Infectious Diseases, she completed her fellowship at the Research Institute for Tropical Medicine (RITM).",
      licenseNumber:     "0189012",
      yearsOfExperience: 11,
      consultationFee:   1200,
      languages:         ["English", "Filipino (Tagalog)"],
      availability:      days([1,2,3], "9:00 AM", "5:00 PM"),
      rating: 4.8, totalReviews: 88,
    },
  },
  {
    email: "rehab@test.com",
    name:  "Benjamin Morales",
    profile: {
      specializations:   ["Physical Therapy & Rehabilitation"],
      bio:               "Dr. Morales is a physiatrist specializing in physical medicine and rehabilitation for stroke recovery, orthopedic injuries, and chronic pain. A Fellow of the Philippine Academy of Rehabilitation Medicine, he designs individualized programs that restore function and improve quality of life.",
      licenseNumber:     "0190123",
      yearsOfExperience: 6,
      consultationFee:   600,
      languages:         ["English", "Filipino (Tagalog)", "Cebuano (Bisaya)"],
      availability:      days([2,4,6], "7:00 AM", "3:00 PM"),
      rating: 4.6, totalReviews: 64,
    },
  },
  {
    email: "allergy@test.com",
    name:  "Rowena Alcantara",
    profile: {
      specializations:   ["Allergy & Immunology"],
      bio:               "Dr. Alcantara is a Fellow of the Philippine Society of Allergy, Asthma and Immunology, specializing in allergic rhinitis, asthma, food allergies, and immune deficiencies. With 15 years of practice, she uses the latest diagnostic protocols and immunotherapy approaches to help patients achieve lasting relief.",
      licenseNumber:     "0201234",
      yearsOfExperience: 15,
      consultationFee:   1800,
      languages:         ["English", "Filipino (Tagalog)", "Hiligaynon (Ilonggo)"],
      availability:      days([1,3,5], "10:00 AM", "6:00 PM"),
      rating: 4.9, totalReviews: 108,
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
        results[seed.email] = "created";
      } else {
        // Always keep the name in sync
        await User.findByIdAndUpdate(user._id, { name: seed.name });
        results[seed.email] = "updated";
      }

      // Always upsert the DoctorProfile so specializations/fees stay in sync
      await DoctorProfile.findOneAndUpdate(
        { userId: user._id },
        { ...seed.profile, isAcceptingPatients: true },
        { upsert: true, new: true }
      );
    }

    return NextResponse.json({
      success: true,
      total: SEED_DOCTORS.length,
      results,
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
