import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import dbConnect from "@/lib/db";
import Appointment from "@/models/Appointment";
import HealthRecord from "@/models/HealthRecord";

// -- GET: fetch all records for an appointment ---------------------------------

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    await dbConnect();

    const appt = await Appointment.findById(id).select("doctorId patientId").lean() as
      { doctorId: { toString(): string }; patientId: { toString(): string } } | null;

    if (!appt || appt.doctorId.toString() !== token.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const records = await HealthRecord.find({ appointmentId: id }).sort({ createdAt: 1 }).lean();

    return NextResponse.json({ records: records.map((r) => ({
      id:             String(r._id),
      type:           r.type,
      issuedAt:       r.issuedAt,
      notes:          r.notes,
      medications:    r.medications,
      tests:          r.tests,
      purpose:        r.purpose,
      referredTo:     r.referredTo,
      referralReason: r.referralReason,
    })) });
  } catch (err) {
    console.error("[doctor/consultations/records GET]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// -- POST: save consultation notes as HealthRecords ---------------------------

interface NotesBody {
  notes:          string;
  prescriptions:  string[];
  labRequests:    string[];
  medicalCert:    { issued: boolean; purpose: string };
  referral:       { issued: boolean; specialization: string };
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    await dbConnect();

    const appt = await Appointment.findById(id).select("doctorId patientId").lean() as
      { doctorId: { toString(): string }; patientId: { toString(): string } } | null;

    if (!appt || appt.doctorId.toString() !== token.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = await req.json() as NotesBody;
    const patientId = appt.patientId.toString();
    const doctorId  = token.id;

    // Delete existing records for this appointment (replace on re-save)
    await HealthRecord.deleteMany({ appointmentId: id });

    const toCreate = [];

    if (body.notes?.trim()) {
      toCreate.push({
        appointmentId: id, patientId, doctorId,
        type: "consultation_note",
        notes: body.notes.trim(),
        issuedAt: new Date(),
      });
    }

    if (body.prescriptions?.length > 0) {
      toCreate.push({
        appointmentId: id, patientId, doctorId,
        type: "prescription",
        medications: body.prescriptions.map((p) => ({
          name: p, dosage: "", frequency: "", duration: "",
        })),
        issuedAt: new Date(),
      });
    }

    if (body.labRequests?.length > 0) {
      toCreate.push({
        appointmentId: id, patientId, doctorId,
        type: "lab_request",
        tests: body.labRequests.map((t) => ({ name: t })),
        issuedAt: new Date(),
      });
    }

    if (body.medicalCert?.issued) {
      toCreate.push({
        appointmentId: id, patientId, doctorId,
        type: "medical_certificate",
        purpose: body.medicalCert.purpose || "Medical clearance",
        issuedAt: new Date(),
      });
    }

    if (body.referral?.issued && body.referral.specialization) {
      toCreate.push({
        appointmentId: id, patientId, doctorId,
        type: "referral",
        referredTo:    body.referral.specialization,
        referralReason: "",
        issuedAt: new Date(),
      });
    }

    if (toCreate.length === 0) {
      return NextResponse.json({ error: "No records to save" }, { status: 400 });
    }

    await HealthRecord.insertMany(toCreate);

    return NextResponse.json({ success: true, count: toCreate.length });
  } catch (err) {
    console.error("[doctor/consultations/records POST]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
