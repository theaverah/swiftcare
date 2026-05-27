/**
 * Seed script — populates SwiftCare with realistic Filipino doctor profiles.
 * Run with: npx tsx scripts/seed.ts
 */

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const MONGODB_URI = process.env.MONGODB_URI!;
if (!MONGODB_URI) throw new Error("MONGODB_URI not set in .env.local");

// ─── Inline schemas (avoid Next.js module resolution issues in a plain script) ─

const UserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true, select: false },
    name: { type: String, required: true },
    role: { type: String, enum: ["patient", "doctor"], required: true },
    isVerified: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const AvailabilitySlotSchema = new mongoose.Schema(
  {
    dayOfWeek: { type: Number, min: 0, max: 6, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    isAvailable: { type: Boolean, default: true },
  },
  { _id: false }
);

const DoctorProfileSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    specialization: { type: String, required: true },
    bio: { type: String },
    profilePicture: { type: String },
    licenseNumber: { type: String },
    yearsOfExperience: { type: Number },
    consultationFee: { type: Number },
    languages: { type: [String], default: ["English", "Filipino"] },
    availability: { type: [AvailabilitySlotSchema], default: [] },
    blockedSlots: { type: [], default: [] },
    rating: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 },
    isAcceptingPatients: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const User = mongoose.models.User ?? mongoose.model("User", UserSchema);
const DoctorProfile = mongoose.models.DoctorProfile ?? mongoose.model("DoctorProfile", DoctorProfileSchema);

// ─── Seed data ────────────────────────────────────────────────────────────────

const MON_WED_FRI = [1, 3, 5]; // Monday, Wednesday, Friday
const TUE_THU     = [2, 4];    // Tuesday, Thursday
const MON_TO_FRI  = [1, 2, 3, 4, 5];
const SAT_SUN     = [6, 0];

function slots(days: number[], start: string, end: string) {
  return days.map((dayOfWeek) => ({ dayOfWeek, startTime: start, endTime: end, isAvailable: true }));
}

const DOCTORS = [
  {
    name: "Dr. Maria Cristina Reyes-Santos",
    email: "mcsantos@swiftcare.ph",
    specialization: "Cardiology",
    licenseNumber: "PRC-MD-2009-0042871",
    yearsOfExperience: 16,
    consultationFee: 1200,
    rating: 4.9,
    totalReviews: 312,
    languages: ["English", "Filipino", "Kapampangan"],
    bio: "Dr. Maria Cristina Reyes-Santos is a board-certified cardiologist with 16 years of clinical experience at The Medical City and St. Luke's Medical Center. She completed her fellowship in Interventional Cardiology at the Philippine Heart Center and holds a subspecialty certification in echocardiography. Dr. Reyes-Santos specializes in the management of coronary artery disease, heart failure, hypertension, and arrhythmias. She is a fellow of the Philippine College of Cardiology and an active member of the Philippine Heart Association. Fluent in English, Filipino, and Kapampangan, she is known for her patient-centered approach and clear communication style.",
    availability: [
      ...slots(MON_WED_FRI, "09:00", "12:00"),
      ...slots(TUE_THU, "14:00", "18:00"),
    ],
  },
  {
    name: "Dr. Jose Miguel Dela Cruz",
    email: "jmdelacruz@swiftcare.ph",
    specialization: "Dermatology",
    licenseNumber: "PRC-MD-2014-0078432",
    yearsOfExperience: 10,
    consultationFee: 950,
    rating: 4.8,
    totalReviews: 489,
    languages: ["English", "Filipino", "Cebuano"],
    bio: "Dr. Jose Miguel Dela Cruz is a diplomate of the Philippine Dermatological Society with a decade of expertise in medical and cosmetic dermatology. He trained at the University of Santo Tomas Hospital and completed an advanced fellowship in dermatopathology at the Philippine General Hospital. His clinical interests include the management of acne, eczema, psoriasis, vitiligo, and skin cancer screening. Dr. Dela Cruz also has extensive experience in aesthetic procedures including laser treatments, chemical peels, and non-surgical skin rejuvenation. He is widely recognized for his evidence-based approach and has authored several papers published in the Journal of the Philippine Dermatological Society.",
    availability: [
      ...slots(MON_TO_FRI, "10:00", "13:00"),
      ...slots([2, 4], "15:00", "19:00"),
    ],
  },
  {
    name: "Dr. Ana Lorraine Bautista-Villanueva",
    email: "albvillanueva@swiftcare.ph",
    specialization: "Obstetrics & Gynecology",
    licenseNumber: "PRC-MD-2011-0055219",
    yearsOfExperience: 13,
    consultationFee: 1100,
    rating: 4.9,
    totalReviews: 567,
    languages: ["English", "Filipino", "Tagalog"],
    bio: "Dr. Ana Lorraine Bautista-Villanueva is a fellow of the Philippine Obstetrical and Gynecological Society (POGS) and a clinical associate professor at the University of the Philippines College of Medicine. With 13 years of experience in maternal-fetal medicine, she specializes in high-risk pregnancies, prenatal care, minimally invasive gynecologic surgery, and reproductive endocrinology. She completed her residency at the Philippine General Hospital and a subspecialty fellowship in laparoscopic surgery at Makati Medical Center. Dr. Bautista-Villanueva is deeply committed to women's health advocacy and has participated in community outreach programs throughout Luzon and the Visayas.",
    availability: [
      ...slots(MON_WED_FRI, "08:00", "12:00"),
      ...slots([6], "09:00", "13:00"),
    ],
  },
  {
    name: "Dr. Roberto Emmanuel Aquino",
    email: "reaquino@swiftcare.ph",
    specialization: "Pediatrics",
    licenseNumber: "PRC-MD-2007-0031654",
    yearsOfExperience: 18,
    consultationFee: 800,
    rating: 4.95,
    totalReviews: 721,
    languages: ["English", "Filipino", "Ilocano"],
    bio: "Dr. Roberto Emmanuel Aquino is one of Metro Manila's most trusted pediatricians, with nearly two decades of experience caring for newborns, infants, children, and adolescents. He is a diplomate of the Philippine Pediatric Society and a certified subspecialist in pediatric infectious diseases. Dr. Aquino completed his residency at Philippine Children's Medical Center and a fellowship at the Asian Hospital and Medical Center. He is particularly known for his warm bedside manner and his ability to put both children and parents at ease. He has a special interest in childhood immunization programs, developmental pediatrics, and management of pediatric respiratory conditions.",
    availability: [
      ...slots(MON_TO_FRI, "09:00", "12:00"),
      ...slots(MON_TO_FRI, "14:00", "17:00"),
    ],
  },
  {
    name: "Dr. Patricia Joy Mendoza-Lim",
    email: "pjlim@swiftcare.ph",
    specialization: "Neurology",
    licenseNumber: "PRC-MD-2012-0061887",
    yearsOfExperience: 12,
    consultationFee: 1300,
    rating: 4.85,
    totalReviews: 203,
    languages: ["English", "Filipino", "Mandarin"],
    bio: "Dr. Patricia Joy Mendoza-Lim is a board-certified neurologist and a fellow of the Philippine Neurological Association. She specializes in the diagnosis and management of stroke, epilepsy, multiple sclerosis, Parkinson's disease, migraine disorders, and neurodegenerative conditions. She completed her neurology residency and clinical neurophysiology fellowship at the National Neuroscience Institute of the Philippines, followed by advanced training in neuro-oncology at National University Hospital, Singapore. Bilingual in English and Mandarin, she serves a broad patient population across Metro Manila and is frequently invited to speak at regional neurology conferences.",
    availability: [
      ...slots(TUE_THU, "09:00", "13:00"),
      ...slots([1, 3], "14:00", "17:00"),
    ],
  },
  {
    name: "Dr. Francisco Gabriel Torres III",
    email: "fgtorres@swiftcare.ph",
    specialization: "Orthopedic Surgery",
    licenseNumber: "PRC-MD-2008-0038291",
    yearsOfExperience: 17,
    consultationFee: 1400,
    rating: 4.88,
    totalReviews: 178,
    languages: ["English", "Filipino"],
    bio: "Dr. Francisco Gabriel Torres III is an orthopedic surgeon and fellow of the Philippine Orthopedic Association with 17 years of experience in adult reconstructive surgery, sports medicine, and spine care. He trained at the University of the East Ramon Magsaysay Memorial Medical Center and completed an overseas fellowship in arthroplasty and arthroscopy at Changi General Hospital in Singapore. Dr. Torres specializes in total hip and knee replacement, ACL reconstruction, rotator cuff repair, and minimally invasive spinal procedures. He is the team physician for two professional sports organizations in the Philippines and regularly lectures at orthopedic conferences across Southeast Asia.",
    availability: [
      ...slots([1, 3, 5], "13:00", "17:00"),
      ...slots([6], "08:00", "12:00"),
    ],
  },
  {
    name: "Dr. Isabel Camille Soriano",
    email: "icsoriano@swiftcare.ph",
    specialization: "Psychiatry",
    licenseNumber: "PRC-MD-2015-0082543",
    yearsOfExperience: 9,
    consultationFee: 1050,
    rating: 4.92,
    totalReviews: 344,
    languages: ["English", "Filipino"],
    bio: "Dr. Isabel Camille Soriano is a psychiatrist and psychotherapist committed to making quality mental health care accessible to all Filipinos. She is a diplomate of the Philippine Psychiatric Association and completed her residency at the National Center for Mental Health, followed by subspecialty training in mood disorders and cognitive-behavioral therapy at St. Luke's Medical Center. Dr. Soriano has expertise in the treatment of depression, anxiety disorders, ADHD, bipolar disorder, PTSD, and psychosis. She takes an integrative approach, combining pharmacotherapy with evidence-based psychotherapeutic techniques. She is an advocate for mental health awareness and runs a widely followed public education initiative on social media.",
    availability: [
      ...slots(MON_TO_FRI, "11:00", "14:00"),
      ...slots(TUE_THU, "16:00", "19:00"),
    ],
  },
  {
    name: "Dr. Reynaldo Anton Castillo",
    email: "racastillo@swiftcare.ph",
    specialization: "General Practice",
    licenseNumber: "PRC-MD-2016-0091204",
    yearsOfExperience: 8,
    consultationFee: 600,
    rating: 4.82,
    totalReviews: 634,
    languages: ["English", "Filipino", "Bisaya"],
    bio: "Dr. Reynaldo Anton Castillo is a family medicine practitioner and the first point of care for hundreds of patients across Metro Manila. He graduated cum laude from Cebu Institute of Medicine and completed his residency in family and community medicine at Jose R. Reyes Memorial Medical Center. Dr. Castillo is skilled in the diagnosis and management of common acute and chronic conditions including diabetes, hypertension, asthma, upper respiratory infections, urinary tract infections, and musculoskeletal pain. He places great importance on preventive care, patient education, and lifestyle counseling. His approachable demeanor and flexible consultation hours make him one of the most in-demand GPs on the platform.",
    availability: [
      ...slots(MON_TO_FRI, "08:00", "12:00"),
      ...slots(MON_TO_FRI, "13:00", "17:00"),
      ...slots(SAT_SUN, "09:00", "13:00"),
    ],
  },
];

// ─── Runner ───────────────────────────────────────────────────────────────────

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log("✓ Connected to MongoDB");

  const password = await bcrypt.hash("SwiftCare2026!", 12);
  let created = 0;
  let skipped = 0;

  for (const doctor of DOCTORS) {
    const { name, email, specialization, licenseNumber, yearsOfExperience,
            consultationFee, rating, totalReviews, languages, bio, availability } = doctor;

    const existing = await User.findOne({ email });
    if (existing) {
      console.log(`  — skipped ${name} (already exists)`);
      skipped++;
      continue;
    }

    const user = await User.create({ email, password, name, role: "doctor", isVerified: true });

    await DoctorProfile.create({
      userId: user._id,
      specialization,
      bio,
      licenseNumber,
      yearsOfExperience,
      consultationFee,
      languages,
      availability,
      rating,
      totalReviews,
      isAcceptingPatients: true,
    });

    console.log(`  ✓ ${name} (${specialization})`);
    created++;
  }

  console.log(`\nDone — ${created} created, ${skipped} skipped.`);
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
