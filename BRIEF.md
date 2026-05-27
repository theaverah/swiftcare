# BRIEF.md — SwiftCare Feature Requirements

This file contains the complete feature requirements for SwiftCare, taken directly from the Whitecloak Launchpad Builder Round brief. This is the source of truth for what needs to be built — all requirements listed here are mandatory and must be followed. Bonus features may be added on top, but nothing here should be removed or skipped.

---

## Two Primary Modules

- **Patient Module** — end-user who books and attends consultations
- **Doctor Module** — medical professional who manages schedules, consultations, prescriptions, and notes

---

## Patient Module

### 1. Patient Account Creation
- Register using email and password
- Add personal profile details: name, birthday, weight, height, profile picture, contact details, basic medical history

### 2. Doctor Discovery
- Browse available doctors and view their availability
- Explore doctors based on medical needs or symptoms
- Filter and search doctors by specialization

### 3. AI Recommendation
- Patient describes their symptoms or healthcare concerns
- AI recommends a doctor based on specialization or expertise

### 4. Appointment Booking
- Book consultations online
- Reschedule or cancel existing appointments
- Real-time push notifications for: booked appointments, upcoming appointments, schedule updates

### 5. Consultation Session
- Join a consultation session online
- Note: no need to build a custom video conferencing solution — use an embed (e.g. Daily.co)

### 6. Medical Records
- View appointment history
- View basic medical records and prescriptions issued by doctors

---

## Doctor Module

### 1. Doctor Profile Management
- Register using email and password
- Add profile details: bio and specialization

### 2. Medical Records Access
- View patient appointment history
- View medical records and prescriptions per patient

### 3. Consultation Schedule Management
- Manage consultation availability and schedules
- Restrict or block unavailable time slots
- Real-time push notifications for: booked appointments, upcoming appointments, schedule updates

### 4. Consultation Notes & Prescriptions
- Add prescriptions and/or consultation notes after each appointment

### 5. Consultation Session
- Join and conduct virtual consultations with patients
- Note: no need to build a custom video conferencing solution — use an embed (e.g. Daily.co)

---

## Bonus Features (Optional)

Bonus features are encouraged but not required. They should answer one or both of these questions:
- How does SwiftCare differentiate itself from other telehealth platforms?
- How does SwiftCare elevate the patient and doctor journey to encourage long-term retention?

No strict limitations — any relevant feature, AI capability, or UX enhancement is fair game as long as it can be demonstrated within the timeline.

---

## Deliverables (PM Track)

| Deliverable | Details |
|---|---|
| Deployed App | Must be publicly accessible via URL |
| Git Repository | Public repo with full codebase |
| Video Demo | Max 15 minutes — walkthrough, limitations, future improvements |
| Deck | Product overview, key features, value proposition |

**Deadline: May 30, 2026 at 11:59 PM**

Submit via: https://forms.gle/2QrDQ17KBhHqWqBK9

---

## Evaluation Criteria (PM Track)

| Competency | Weight |
|---|---|
| Design & Product Sense | 40% |
| Functionality & Scope Covered | 30% |
| Presentation & Communication | 30% |
| Code Quality | 0% |

---

## Tips from the Brief

- Thoughtful product decisions, clean architecture, strong execution, and polished UX are valued over feature quantity
- A smaller but well-designed and complete solution is preferred over an ambitious but unfinished one
- Focus on core features first before moving to bonus features