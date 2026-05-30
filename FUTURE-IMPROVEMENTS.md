# FUTURE-IMPROVEMENTS.md — SwiftCare

Things we scoped out of the MVP on purpose. Each one has a clear path forward.

---

## 1. Real-Time Slot Selection & Doctor Confirmation

**Now:** Patients pick a date and time preference (Morning, Afternoon, or Evening). The system auto-assigns a 30-minute slot and confirms the booking right away.

**Next:** Patients pick from the doctor's actual available slots. The booking stays "Pending" until the doctor confirms, within 2 hours for same-day bookings and 24 hours for future ones. If they don't respond in time, the booking is cancelled and a full refund is issued. This matters a lot for trust. When someone books a medical consultation, they need to know exactly when they'll be seen, and that there's a clear safety net if something falls through.

---

## 2. Payment Integration

**Now:** The booking flow shows the consultation fee, but no real payment goes through.

**Next:** Integrate PayMongo or GCash. Payment is collected at booking and automatically refunded if the doctor doesn't confirm in time.

---

## 3. In-App Messaging

**Now:** No way to message outside of the actual consultation session.

**Next:** Patients can send messages to their booked doctor before the session — questions, symptom photos, documents. It reduces anxiety going in and gives the doctor more context. Messages stay tied to the appointment and show up in medical records after.

---

## 4. Email Verification

**Now:** OTP is mocked for demo purposes. Any code works.

**Next:** Real OTP emails via Resend, with a 10-minute expiry, proper validation, and resend throttling.

---

## 5. AI Doctor Recommendation

**Now:** The AI input field is on the home dashboard, but it's not connected to a live model yet.

**Next:** Connect to Gemini API. The AI reads the patient's input and medical history, then returns a ranked list of recommended doctors with plain-language explanations. The suggestion chips on the home page would also be personalized based on each patient's profile.

---

## 6. Booking & Scheduling Conflict Validation

**Now:** The booking flow accepts any date and time preference without checking for conflicts. A patient can book multiple appointments with the same doctor, reschedule to their current slot, or create overlapping consultations.

**Next:** Add proper conflict detection at both the API and UI layer:

- **Duplicate booking guard** — prevent a patient from booking a second appointment with the same doctor if an active (confirmed or pending) one already exists
- **Reschedule conflict check** — when rescheduling, validate that the new date/time is different from the existing one before allowing submission
- **Overlapping appointment check** — prevent a patient from booking two consultations that overlap in time, regardless of doctor
- **Doctor-side conflict check** — prevent a doctor's calendar from double-booking two patients in the same time slot
- **Same-day cancellation window** — block cancellations or reschedules within a minimum time window (e.g. 1 hour before the session)
- **Past date guard** — reject bookings for dates that have already passed, both client-side and server-side
- **Max concurrent booking limit** — optionally cap the number of active upcoming bookings per patient

All of these should return clear, user-facing error messages — not silent failures or generic 500 errors.

---

*Last updated: May 2026*
