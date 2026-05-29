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

*Last updated: May 2026*
