import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import DoctorProfile from "@/models/DoctorProfile";
import Appointment from "@/models/Appointment";
import HealthRecord from "@/models/HealthRecord";

export async function POST() {
  try {
    await dbConnect();

    // Find the test patient
    const patient = await User.findOne({ email: "patient@test.com" }).lean() as
      ({ _id: mongoose.Types.ObjectId } & Record<string, unknown>) | null;
    if (!patient) return NextResponse.json({ error: "patient@test.com not found" }, { status: 404 });

    const patientId = patient._id;

    // Find doctors
    const doctors = await User.find({ role: "doctor" }).select("_id name").limit(4).lean() as
      { _id: mongoose.Types.ObjectId; name: string }[];
    if (doctors.length < 2) return NextResponse.json({ error: "Need at least 2 doctors seeded first" }, { status: 400 });

    const profiles = await DoctorProfile.find({ userId: { $in: doctors.map(d => d._id) } })
      .select("userId specializations").lean() as
      { userId: mongoose.Types.ObjectId; specializations: string[] }[];
    const profileMap = new Map(profiles.map(p => [String(p.userId), p]));

    // Create appointments for the patient (or reuse existing)
    async function ensureAppointment(doctorId: mongoose.Types.ObjectId, daysAgo: number) {
      const existing = await Appointment.findOne({ patientId, doctorId }).lean();
      if (existing) return existing._id as mongoose.Types.ObjectId;

      const scheduled = new Date();
      scheduled.setDate(scheduled.getDate() - daysAgo);

      const appt = await Appointment.create({
        patientId,
        doctorId,
        scheduledAt:     scheduled,
        durationMinutes: 30,
        status:          "completed",
        chiefComplaint:  "Follow-up consultation",
        forSelf:         true,
        patientName:     "Alex Rivera",
        consultationType:"video",
      });
      return appt._id as mongoose.Types.ObjectId;
    }

    const doc0 = doctors[0];
    const doc1 = doctors[1];
    const doc2 = doctors[2] ?? doctors[0];
    const doc3 = doctors[3] ?? doctors[1];

    const [appt1, appt2, appt3, appt4] = await Promise.all([
      ensureAppointment(doc0._id, 10),
      ensureAppointment(doc1._id, 20),
      ensureAppointment(doc2._id, 35),
      ensureAppointment(doc3._id, 50),
    ]);

    // Clear existing health records for this patient to avoid duplicate seeding
    await HealthRecord.deleteMany({ patientId });

    const issued = (daysAgo: number) => {
      const d = new Date();
      d.setDate(d.getDate() - daysAgo);
      return d;
    };

    const spec0 = profileMap.get(String(doc0._id))?.specializations?.[0] ?? "Internal Medicine";
    const spec1 = profileMap.get(String(doc1._id))?.specializations?.[0] ?? "Cardiology";
    const spec2 = profileMap.get(String(doc2._id))?.specializations?.[0] ?? "General Practice";
    const spec3 = profileMap.get(String(doc3._id))?.specializations?.[0] ?? "Pulmonology";

    const records = [
      // ── Prescriptions ─────────────────────────────────────────────────────
      {
        patientId,
        doctorId:      doc0._id,
        appointmentId: appt1,
        type:          "prescription",
        issuedAt:      issued(10),
        medications: [
          { name: "Metformin",    dosage: "500mg",  frequency: "Twice daily",   duration: "3 months" },
          { name: "Amlodipine",   dosage: "5mg",    frequency: "Once daily",    duration: "Ongoing"  },
        ],
      },
      {
        patientId,
        doctorId:      doc1._id,
        appointmentId: appt2,
        type:          "prescription",
        issuedAt:      issued(20),
        medications: [
          { name: "Atorvastatin", dosage: "20mg",   frequency: "Once at night", duration: "6 months" },
          { name: "Aspirin",      dosage: "80mg",   frequency: "Once daily",    duration: "Ongoing"  },
        ],
      },
      // ── Consultation Notes ────────────────────────────────────────────────
      {
        patientId,
        doctorId:      doc0._id,
        appointmentId: appt1,
        type:          "consultation_note",
        issuedAt:      issued(10),
        notes: `Patient presents with persistent fatigue and mild polyuria for the past 2 weeks. Fasting blood glucose was 126 mg/dL on two separate occasions, consistent with Type 2 Diabetes Mellitus. Patient is otherwise in good health with no cardiovascular complaints. Initiated Metformin 500mg BID with meals. Advised low-carbohydrate diet and moderate daily exercise. Ordered HbA1c, lipid profile, and renal function tests. Follow-up in 4 weeks.`,
      },
      {
        patientId,
        doctorId:      doc1._id,
        appointmentId: appt2,
        type:          "consultation_note",
        issuedAt:      issued(20),
        notes: `Patient referred for evaluation of elevated blood pressure (152/94 mmHg on 3 readings). ECG shows mild LVH. Lipid panel reveals LDL of 148 mg/dL. Initiated Atorvastatin 20mg nightly and low-dose Aspirin 80mg. Lifestyle modification counseling provided — sodium restriction, regular aerobic exercise. Patient to return in 6 weeks for BP monitoring and repeat lipid panel.`,
      },
      // ── Lab Requests ──────────────────────────────────────────────────────
      {
        patientId,
        doctorId:      doc0._id,
        appointmentId: appt1,
        type:          "lab_request",
        issuedAt:      issued(10),
        tests: [
          { name: "HbA1c (Glycated Hemoglobin)" },
          { name: "Fasting Blood Glucose" },
          { name: "Lipid Profile (Total Cholesterol, LDL, HDL, Triglycerides)" },
          { name: "Creatinine and eGFR (Renal Function)" },
        ],
      },
      {
        patientId,
        doctorId:      doc2._id,
        appointmentId: appt3,
        type:          "lab_request",
        issuedAt:      issued(35),
        tests: [
          { name: "Complete Blood Count (CBC)" },
          { name: "Thyroid Stimulating Hormone (TSH)" },
          { name: "Urinalysis" },
        ],
      },
      // ── Medical Certificates ──────────────────────────────────────────────
      {
        patientId,
        doctorId:      doc2._id,
        appointmentId: appt3,
        type:          "medical_certificate",
        issuedAt:      issued(35),
        purpose:       "For work clearance — patient was seen and examined on the above date and is fit to return to office work.",
      },
      {
        patientId,
        doctorId:      doc3._id,
        appointmentId: appt4,
        type:          "medical_certificate",
        issuedAt:      issued(50),
        purpose:       "For travel clearance — patient is in stable health condition and is medically cleared to travel by air.",
      },
      // ── Referrals ─────────────────────────────────────────────────────────
      {
        patientId,
        doctorId:      doc0._id,
        appointmentId: appt1,
        type:          "referral",
        issuedAt:      issued(10),
        referredTo:    "Cardiology",
        referralReason:"Patient has persistent hypertension with LVH on ECG. Referred for full cardiovascular workup and echocardiogram.",
      },
      {
        patientId,
        doctorId:      doc1._id,
        appointmentId: appt2,
        type:          "referral",
        issuedAt:      issued(20),
        referredTo:    "Endocrinology",
        referralReason:`Patient's HbA1c remains above target (8.2%) despite 3 months on Metformin. Referred to ${spec1} for specialist management of Type 2 Diabetes.`,
      },
    ];

    await HealthRecord.insertMany(records);

    return NextResponse.json({
      success: true,
      inserted: records.length,
      message: `Seeded ${records.length} health records for patient@test.com`,
    });
  } catch (err) {
    console.error("[seed/health-records]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
