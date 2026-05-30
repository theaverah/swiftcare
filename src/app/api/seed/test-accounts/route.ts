import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import PatientProfile from "@/models/PatientProfile";
import DoctorProfile from "@/models/DoctorProfile";
import Appointment from "@/models/Appointment";
import HealthRecord from "@/models/HealthRecord";
import type { DayOfWeek } from "@/models/DoctorProfile";

const PASSWORD = "Test1234!";

function days(dows: number[], start: string, end: string) {
  return dows.map(d => ({ dayOfWeek: d as DayOfWeek, startTime: start, endTime: end, isAvailable: true }));
}

const SEED_DOCTORS = [
  // -- 20 original doctors (fees adjusted, city added) ---------------------------
  {
    email: "doctor@test.com",
    name:  "Maria Cristina Reyes-Santos",
    profile: {
      specializations:   ["General Practice", "Internal Medicine"],
      bio:               "A warm, patient-centered physician with over a decade of experience in general and internal medicine. She believes in treating the whole person, not just the condition.",
      licenseNumber:     "4232331",
      yearsOfExperience: 12,
      consultationFee:   800,
      languages:         ["English", "Filipino (Tagalog)", "Cebuano"],
      city:              "Manila",
      availability:      days([1,2,3,4,5], "9:00 AM", "5:00 PM"),
      rating: 4.9, totalReviews: 187,
      education:        { medicalSchool: "UP College of Medicine", residency: "Internal Medicine, Philippine General Hospital" },
      certifications:   ["Philippine Board of Internal Medicine", "Basic Life Support Certified"],
      affiliations:     ["Philippine Medical Association", "Philippine College of Physicians"],
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
      consultationFee:   800,
      languages:         ["English", "Filipino (Tagalog)"],
      city:              "Quezon City",
      availability:      days([1,3,5], "9:00 AM", "4:00 PM"),
      rating: 4.9, totalReviews: 210,
      education:        { medicalSchool: "UST Faculty of Medicine and Surgery", residency: "Cardiology, Philippine Heart Center" },
      certifications:   ["Philippine Board of Cardiology", "Fellow of the Philippine College of Cardiology"],
      affiliations:     ["Philippine Heart Association", "Philippine College of Cardiology", "Philippine Medical Association"],
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
      consultationFee:   500,
      languages:         ["English", "Filipino (Tagalog)", "Ilocano"],
      city:              "Makati City",
      availability:      days([2,4], "10:00 AM", "6:00 PM"),
      rating: 4.7, totalReviews: 88,
      education:        { medicalSchool: "Ateneo School of Medicine and Public Health", residency: "Dermatology, Makati Medical Center" },
      certifications:   ["Philippine Dermatological Board", "Fellow of the Philippine Dermatological Society"],
      affiliations:     ["Philippine Dermatological Society", "Philippine Medical Association"],
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
      consultationFee:   400,
      languages:         ["English", "Filipino (Tagalog)", "Cebuano (Bisaya)"],
      city:              "Quezon City",
      availability:      days([1,2,3,4,5], "8:00 AM", "4:00 PM"),
      rating: 4.9, totalReviews: 302,
      education:        { medicalSchool: "UP College of Medicine", residency: "Pediatrics, Philippine Children's Medical Center" },
      certifications:   ["Philippine Pediatric Board", "Fellow of the Philippine Pediatric Society"],
      affiliations:     ["Philippine Pediatric Society", "Philippine Medical Association"],
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
      consultationFee:   700,
      languages:         ["English", "Filipino (Tagalog)"],
      city:              "Taguig City",
      availability:      days([1,2,4,5], "9:00 AM", "5:00 PM"),
      rating: 4.8, totalReviews: 176,
      education:        { medicalSchool: "De La Salle Medical and Health Sciences Institute", residency: "Obstetrics and Gynecology, St. Luke's Medical Center BGC" },
      certifications:   ["Philippine Board of Obstetrics and Gynecology", "Fellow of the Philippine Obstetrical and Gynecological Society"],
      affiliations:     ["Philippine Obstetrical and Gynecological Society", "Philippine Medical Association"],
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
      consultationFee:   1000,
      languages:         ["English", "Filipino (Tagalog)"],
      city:              "Quezon City",
      availability:      days([2,3,5], "7:00 AM", "3:00 PM"),
      rating: 4.7, totalReviews: 143,
      education:        { medicalSchool: "FEU Institute of Medicine", residency: "Orthopedic Surgery, Philippine Orthopedic Center" },
      certifications:   ["Philippine Board of Orthopedic Surgery", "Sports Medicine Certification (PSSMM)"],
      affiliations:     ["Philippine Orthopedic Association", "Philippine Society of Sports Medicine", "Philippine Medical Association"],
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
      consultationFee:   500,
      languages:         ["English", "Filipino (Tagalog)", "Kapampangan"],
      city:              "Mandaluyong City",
      availability:      days([1,3,4], "2:00 PM", "8:00 PM"),
      rating: 5.0, totalReviews: 95,
      education:        { medicalSchool: "UP College of Medicine", residency: "Psychiatry, National Center for Mental Health" },
      certifications:   ["Philippine Board of Psychiatry", "Fellow of the Philippine Psychiatric Association"],
      affiliations:     ["Philippine Psychiatric Association", "Philippine Medical Association"],
    },
  },
  {
    email: "neurologist@test.com",
    name:  "Maribel Santos-Gonzalez",
    profile: {
      specializations:   ["Neurology"],
      bio:               "Dr. Santos-Gonzalez is a board-certified neurologist specializing in headache disorders, epilepsy, and stroke management. With 11 years of clinical experience at St. Luke's Medical Center and Philippine General Hospital, she brings evidence-based, compassionate care to complex neurological conditions.",
      licenseNumber:     "0089012",
      yearsOfExperience: 11,
      consultationFee:   1200,
      languages:         ["English", "Filipino (Tagalog)"],
      city:              "Taguig City",
      availability:      days([1,3,4,5], "9:00 AM", "5:00 PM"),
      rating: 4.8, totalReviews: 112,
      education:        { medicalSchool: "UST Faculty of Medicine and Surgery", residency: "Neurology, St. Luke's Medical Center BGC" },
      certifications:   ["Philippine Board of Neurology and Psychiatry (Neurology)", "Fellow of the Philippine Neurological Association"],
      affiliations:     ["Philippine Neurological Association", "Philippine Medical Association"],
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
      consultationFee:   500,
      languages:         ["English", "Filipino (Tagalog)", "Cebuano (Bisaya)"],
      city:              "Manila",
      availability:      days([1,2,3,4,5], "8:00 AM", "8:00 PM"),
      rating: 4.7, totalReviews: 201,
      education:        { medicalSchool: "Far Eastern University Institute of Medicine", residency: "Emergency Medicine, Philippine General Hospital" },
      certifications:   ["Philippine Board of Emergency Medicine", "Advanced Trauma Life Support (ATLS)", "Basic Life Support Instructor (BLS)"],
      affiliations:     ["Philippine College of Emergency Medicine", "Philippine Medical Association"],
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
      consultationFee:   700,
      languages:         ["English", "Filipino (Tagalog)"],
      city:              "Quezon City",
      availability:      days([2,5,6], "9:00 AM", "5:00 PM"),
      rating: 4.9, totalReviews: 87,
      education:        { medicalSchool: "Ateneo School of Medicine and Public Health", residency: "Endocrinology, St. Luke's Medical Center QC" },
      certifications:   ["Philippine Board of Internal Medicine", "Fellow of the Philippine Society of Endocrinology, Diabetes and Metabolism"],
      affiliations:     ["Philippine Society of Endocrinology, Diabetes and Metabolism", "Philippine Medical Association"],
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
      consultationFee:   600,
      languages:         ["English", "Filipino (Tagalog)", "Waray"],
      city:              "Pasig City",
      availability:      days([1,3,5], "10:00 AM", "5:00 PM"),
      rating: 4.8, totalReviews: 143,
      education:        { medicalSchool: "UP College of Medicine", residency: "Ophthalmology, Philippine General Hospital · Fellowship, Asian Eye Institute" },
      certifications:   ["Philippine Board of Ophthalmology", "Fellow of the Philippine Academy of Ophthalmology"],
      affiliations:     ["Philippine Academy of Ophthalmology", "Philippine Medical Association"],
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
      consultationFee:   700,
      languages:         ["English", "Filipino (Tagalog)"],
      city:              "Pasig City",
      availability:      days([2,4], "1:00 PM", "7:00 PM"),
      rating: 4.7, totalReviews: 76,
      education:        { medicalSchool: "De La Salle Medical and Health Sciences Institute", residency: "Rheumatology, The Medical City" },
      certifications:   ["Philippine Board of Internal Medicine", "Fellow of the Philippine Rheumatology Association"],
      affiliations:     ["Philippine Rheumatology Association", "Philippine Medical Association"],
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
      consultationFee:   900,
      languages:         ["English", "Filipino (Tagalog)"],
      city:              "Quezon City",
      availability:      days([1,3,5], "8:00 AM", "4:00 PM"),
      rating: 4.9, totalReviews: 164,
      education:        { medicalSchool: "UST Faculty of Medicine and Surgery", residency: "Nephrology, National Kidney Transplant Institute" },
      certifications:   ["Philippine Board of Internal Medicine", "Fellow of the Philippine Society of Nephrology"],
      affiliations:     ["Philippine Society of Nephrology", "Philippine Medical Association"],
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
      consultationFee:   600,
      languages:         ["English", "Filipino (Tagalog)"],
      city:              "Manila",
      availability:      days([1,2,5,6], "8:00 AM", "5:00 PM"),
      rating: 4.8, totalReviews: 98,
      education:        { medicalSchool: "UP College of Medicine", residency: "Pulmonology, Philippine General Hospital" },
      certifications:   ["Philippine Board of Pulmonology", "Fellow of the Philippine College of Chest Physicians"],
      affiliations:     ["Philippine College of Chest Physicians", "Philippine Medical Association"],
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
      consultationFee:   700,
      languages:         ["English", "Filipino (Tagalog)"],
      city:              "Makati City",
      availability:      days([1,2,3,5], "9:00 AM", "6:00 PM"),
      rating: 4.9, totalReviews: 187,
      education:        { medicalSchool: "UP College of Medicine", residency: "Gastroenterology, Makati Medical Center" },
      certifications:   ["Philippine Board of Internal Medicine", "Fellow of the Philippine Society of Gastroenterology"],
      affiliations:     ["Philippine Society of Gastroenterology", "Philippine Medical Association"],
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
      consultationFee:   300,
      languages:         ["English", "Filipino (Tagalog)", "Cebuano (Bisaya)"],
      city:              "Makati City",
      availability:      days([1,2,3,4,5,6], "7:00 AM", "7:00 PM"),
      rating: 5.0, totalReviews: 342,
      education:        { medicalSchool: "FEU Institute of Medicine", residency: "Family Medicine, Ospital ng Makati" },
      certifications:   ["Philippine Board of Family Medicine", "Fellow of the Philippine Academy of Family Physicians"],
      affiliations:     ["Philippine Academy of Family Physicians", "Philippine Medical Association"],
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
      consultationFee:   800,
      languages:         ["English", "Filipino (Tagalog)"],
      city:              "San Juan City",
      availability:      days([1,3,5,6], "8:00 AM", "4:00 PM"),
      rating: 4.7, totalReviews: 156,
      education:        { medicalSchool: "UST Faculty of Medicine and Surgery", residency: "Urology, Cardinal Santos Medical Center" },
      certifications:   ["Philippine Board of Urology", "Fellow of the Philippine Urological Association"],
      affiliations:     ["Philippine Urological Association", "Philippine Medical Association"],
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
      consultationFee:   500,
      languages:         ["English", "Filipino (Tagalog)"],
      city:              "Muntinlupa City",
      availability:      days([1,2,3], "9:00 AM", "5:00 PM"),
      rating: 4.8, totalReviews: 88,
      education:        { medicalSchool: "UP College of Medicine", residency: "Infectious Disease, Research Institute for Tropical Medicine (RITM)" },
      certifications:   ["Philippine Board of Internal Medicine", "Certificate of Training in Infectious Disease (RITM)"],
      affiliations:     ["Philippine Society for Microbiology and Infectious Diseases", "Philippine Medical Association"],
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
      consultationFee:   400,
      languages:         ["English", "Filipino (Tagalog)", "Cebuano (Bisaya)"],
      city:              "Pasay City",
      availability:      days([2,4,6], "7:00 AM", "3:00 PM"),
      rating: 4.6, totalReviews: 64,
      education:        { medicalSchool: "De La Salle Medical and Health Sciences Institute", residency: "Physical Medicine and Rehabilitation, National Rehabilitation Center" },
      certifications:   ["Philippine Board of Physical Medicine and Rehabilitation", "Fellow of the Philippine Academy of Rehabilitation Medicine"],
      affiliations:     ["Philippine Academy of Rehabilitation Medicine", "Philippine Medical Association"],
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
      consultationFee:   600,
      languages:         ["English", "Filipino (Tagalog)", "Hiligaynon (Ilonggo)"],
      city:              "Muntinlupa City",
      availability:      days([1,3,5], "10:00 AM", "6:00 PM"),
      rating: 4.9, totalReviews: 108,
      education:        { medicalSchool: "Ateneo School of Medicine and Public Health", residency: "Allergy and Clinical Immunology, Asian Hospital and Medical Center" },
      certifications:   ["Philippine Board of Internal Medicine", "Certificate in Allergy and Clinical Immunology"],
      affiliations:     ["Philippine Society of Allergy, Asthma and Immunology", "Philippine Medical Association"],
    },
  },

  // -- 7 new doctors -------------------------------------------------------------
  {
    email: "obgyn2@test.com",
    name:  "Rosario Cruz-Bautista",
    profile: {
      specializations:   ["Obstetrics & Gynecology"],
      bio:               "Dr. Cruz-Bautista is an OB-GYN with 10 years of experience in prenatal care, high-risk pregnancy management, and laparoscopic gynecologic surgery. She practices at Ospital ng Makati and is known for her warm, patient-centered approach.",
      licenseNumber:     "0212345",
      yearsOfExperience: 10,
      consultationFee:   500,
      languages:         ["English", "Filipino (Tagalog)"],
      city:              "Makati City",
      availability:      days([1,2,3,4,5], "8:00 AM", "5:00 PM"),
      rating: 4.8, totalReviews: 134,
      education:        { medicalSchool: "UP College of Medicine", residency: "Obstetrics and Gynecology, Philippine General Hospital" },
      certifications:   ["Philippine Board of Obstetrics and Gynecology", "Fellow of the Philippine Obstetrical and Gynecological Society"],
      affiliations:     ["Philippine Obstetrical and Gynecological Society", "Philippine Medical Association"],
    },
  },
  {
    email: "obgyn3@test.com",
    name:  "Carmela Joson-Torres",
    profile: {
      specializations:   ["Obstetrics & Gynecology", "Maternal-Fetal Medicine"],
      bio:               "Dr. Joson-Torres is a Maternal-Fetal Medicine subspecialist with expertise in managing high-risk pregnancies, fetal anomalies, and complications such as preeclampsia and gestational diabetes. She completed her MFM fellowship at Philippine General Hospital.",
      licenseNumber:     "0223456",
      yearsOfExperience: 12,
      consultationFee:   700,
      languages:         ["English", "Filipino (Tagalog)"],
      city:              "San Juan City",
      availability:      days([1,3,4,5], "9:00 AM", "5:00 PM"),
      rating: 4.9, totalReviews: 97,
      education:        { medicalSchool: "UST Faculty of Medicine and Surgery", residency: "OB-GYN, St. Luke's Medical Center QC · MFM Fellowship, Philippine General Hospital" },
      certifications:   ["Philippine Board of Obstetrics and Gynecology", "Fellow of POGS", "Certificate in Maternal-Fetal Medicine"],
      affiliations:     ["Philippine Obstetrical and Gynecological Society", "Philippine Maternal-Fetal Medicine Society", "Philippine Medical Association"],
    },
  },
  {
    email: "obgyn4@test.com",
    name:  "Jennifer Lim-Pascual",
    profile: {
      specializations:   ["Obstetrics & Gynecology"],
      bio:               "Dr. Lim-Pascual is an OB-GYN committed to compassionate women's health care. She specializes in routine and complex obstetric cases, gynecologic oncology screening, and minimally invasive procedures at The Medical City.",
      licenseNumber:     "0234567",
      yearsOfExperience: 8,
      consultationFee:   500,
      languages:         ["English", "Filipino (Tagalog)", "Mandarin"],
      city:              "Pasig City",
      availability:      days([2,3,4,5], "10:00 AM", "6:00 PM"),
      rating: 4.7, totalReviews: 82,
      education:        { medicalSchool: "De La Salle Medical and Health Sciences Institute", residency: "Obstetrics and Gynecology, The Medical City" },
      certifications:   ["Philippine Board of Obstetrics and Gynecology", "Fellow of the Philippine Obstetrical and Gynecological Society"],
      affiliations:     ["Philippine Obstetrical and Gynecological Society", "Philippine Medical Association"],
    },
  },
  {
    email: "obgyn5@test.com",
    name:  "Maria Cristina Adlawan",
    profile: {
      specializations:   ["Obstetrics & Gynecology"],
      bio:               "Dr. Adlawan is an OB-GYN based in Cebu City, providing comprehensive prenatal and gynecologic care. She is affiliated with Vicente Sotto Memorial Medical Center and is a trusted practitioner in the Visayas region.",
      licenseNumber:     "0245678",
      yearsOfExperience: 9,
      consultationFee:   450,
      languages:         ["English", "Filipino (Tagalog)", "Cebuano (Bisaya)"],
      city:              "Cebu City",
      availability:      days([1,2,3,4,5], "8:00 AM", "5:00 PM"),
      rating: 4.8, totalReviews: 116,
      education:        { medicalSchool: "University of the East Ramon Magsaysay Memorial Medical Center", residency: "Obstetrics and Gynecology, Vicente Sotto Memorial Medical Center" },
      certifications:   ["Philippine Board of Obstetrics and Gynecology", "Fellow of the Philippine Obstetrical and Gynecological Society"],
      affiliations:     ["Philippine Obstetrical and Gynecological Society", "Cebu Medical Society", "Philippine Medical Association"],
    },
  },
  {
    email: "familymed2@test.com",
    name:  "Ramon Gonzalez Jr.",
    profile: {
      specializations:   ["Family Medicine", "General Practice"],
      bio:               "Dr. Gonzalez is a family physician providing affordable, accessible primary care at Makati Medical Center. He focuses on preventive medicine, chronic disease management, and health education for patients of all ages.",
      licenseNumber:     "0256789",
      yearsOfExperience: 6,
      consultationFee:   300,
      languages:         ["English", "Filipino (Tagalog)"],
      city:              "Makati City",
      availability:      days([1,2,3,4,5,6], "8:00 AM", "6:00 PM"),
      rating: 4.7, totalReviews: 201,
      education:        { medicalSchool: "FEU Institute of Medicine", residency: "Family Medicine, Ospital ng Makati" },
      certifications:   ["Philippine Board of Family Medicine", "Fellow of the Philippine Academy of Family Physicians"],
      affiliations:     ["Philippine Academy of Family Physicians", "Philippine Medical Association"],
    },
  },
  {
    email: "pedia2@test.com",
    name:  "Kristine Joy Reyes-Santos",
    profile: {
      specializations:   ["Pediatrics"],
      bio:               "Dr. Reyes-Santos is a pediatrician dedicated to child health and development, from newborns to teenagers. She practices at Philippine Children's Medical Center and is passionate about preventive care and early developmental screening.",
      licenseNumber:     "0267890",
      yearsOfExperience: 5,
      consultationFee:   350,
      languages:         ["English", "Filipino (Tagalog)"],
      city:              "Quezon City",
      availability:      days([1,2,3,4,5], "9:00 AM", "5:00 PM"),
      rating: 4.9, totalReviews: 178,
      education:        { medicalSchool: "Ateneo School of Medicine and Public Health", residency: "Pediatrics, Philippine Children's Medical Center" },
      certifications:   ["Philippine Pediatric Board", "Fellow of the Philippine Pediatric Society"],
      affiliations:     ["Philippine Pediatric Society", "Philippine Medical Association"],
    },
  },
  {
    email: "internist2@test.com",
    name:  "Mark Anthony Villanueva",
    profile: {
      specializations:   ["Internal Medicine", "General Practice"],
      bio:               "Dr. Villanueva is an internist based in Cebu City serving patients at Chong Hua Hospital. He specializes in the management of chronic conditions including hypertension, diabetes, and metabolic disorders.",
      licenseNumber:     "0278901",
      yearsOfExperience: 8,
      consultationFee:   400,
      languages:         ["English", "Filipino (Tagalog)", "Cebuano (Bisaya)"],
      city:              "Cebu City",
      availability:      days([1,2,3,4,5], "8:00 AM", "5:00 PM"),
      rating: 4.7, totalReviews: 143,
      education:        { medicalSchool: "Cebu Institute of Medicine", residency: "Internal Medicine, Vicente Sotto Memorial Medical Center" },
      certifications:   ["Philippine Board of Internal Medicine"],
      affiliations:     ["Philippine College of Physicians", "Cebu Medical Society", "Philippine Medical Association"],
    },
  },
];

export async function GET() {
  try {
    await dbConnect();

    const hashedPassword = await bcrypt.hash(PASSWORD, 12);
    const results: Record<string, string> = {};

    // -- Patient ---------------------------------------------------------------
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

    // -- Remove non-seed doctor accounts --------------------------------------
    const seedEmails = SEED_DOCTORS.map(d => d.email);
    const staleUsers = await User.find({
      role: "doctor",
      email: { $nin: [...seedEmails, "patient@test.com"] },
    }).select("_id").lean();

    if (staleUsers.length > 0) {
      const staleIds = staleUsers.map(u => u._id);
      await DoctorProfile.deleteMany({ userId: { $in: staleIds } });
      await User.deleteMany({ _id: { $in: staleIds } });
      results._cleaned = `removed ${staleUsers.length} stale doctor(s)`;
    }

    // -- Doctors ---------------------------------------------------------------
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
        { upsert: true, returnDocument: "after" }
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

// -- POST — seed consultations + health records for patient@test.com ------------

export async function POST() {
  try {
    await dbConnect();

    const patient = await User.findOne({ email: "patient@test.com" }).lean() as
      { _id: mongoose.Types.ObjectId } & Record<string, unknown> | null;
    if (!patient) return NextResponse.json({ error: "Run GET first to create patient@test.com" }, { status: 400 });

    // Resolve doctor IDs by email
    async function doctorId(email: string): Promise<mongoose.Types.ObjectId> {
      const u = await User.findOne({ email }).select("_id").lean() as { _id: mongoose.Types.ObjectId } | null;
      if (!u) throw new Error(`Doctor ${email} not found — run GET first`);
      return u._id;
    }

    const [reyesId, santosId, ramirezId, bustamId, alcantaraId, limId] = await Promise.all([
      doctorId("doctor@test.com"),      // Reyes  — General Practice
      doctorId("santos@test.com"),       // Santos — Cardiology
      doctorId("ramirez@test.com"),      // Ramirez — Dermatology
      doctorId("endocrine@test.com"),    // Bustamante — Endocrinology
      doctorId("allergy@test.com"),      // Alcantara — Allergy & Immunology
      doctorId("lim@test.com"),          // Lim — Psychiatry
    ]);

    const patientId = patient._id;

    // -- Date helpers ----------------------------------------------------------
    function daysFromNow(n: number, hour = 9, minute = 0) {
      const d = new Date();
      d.setDate(d.getDate() + n);
      d.setHours(hour, minute, 0, 0);
      return d;
    }
    function fixedDate(y: number, m: number, day: number, hour = 10, minute = 0) {
      return new Date(y, m - 1, day, hour, minute, 0, 0);
    }

    // -- Wipe patient's own appointments only (not the doctor seed data) --------
    await Appointment.deleteMany({ patientId, forSelf: true });
    await HealthRecord.deleteMany({ patientId });

    // -- Consultations ---------------------------------------------------------
    const base = {
      patientId,
      forSelf:         true,
      patientName:     "Alex Rivera",
      consultationType:"video" as const,
      durationMinutes: 30,
    };

    const [
      _upcomingBP,      // tomorrow  — Dr. Santos (Cardiology) — blood pressure
      _upcomingSkin,    // +3 days   — Dr. Ramirez (Dermatology) — skin irritation
      pastMay20,        // May 20    — Dr. Reyes (General Practice)
      pastMay15,        // May 15    — Dr. Bustamante (Endocrinology)
      pastMay5,         // May 5     — Dr. Alcantara (Allergy & Immunology)
      _cancelledAppt,   // -7 days   — Dr. Lim (Psychiatry)
    ] = await Appointment.insertMany([
      {
        ...base,
        doctorId:      santosId,
        scheduledAt:   daysFromNow(1, 9, 0),
        status:        "confirmed",
        chiefComplaint:"Follow-up on blood pressure medication",
      },
      {
        ...base,
        doctorId:      ramirezId,
        scheduledAt:   daysFromNow(3, 14, 0),
        status:        "confirmed",
        chiefComplaint:"Skin irritation on left arm",
      },
      {
        ...base,
        doctorId:      reyesId,
        scheduledAt:   fixedDate(2026, 5, 20, 10, 0),
        status:        "completed",
        chiefComplaint:"Annual check-up and routine labs",
      },
      {
        ...base,
        doctorId:      bustamId,
        scheduledAt:   fixedDate(2026, 5, 15, 15, 0),
        status:        "completed",
        chiefComplaint:"Diabetes management and medication review",
      },
      {
        ...base,
        doctorId:      alcantaraId,
        scheduledAt:   fixedDate(2026, 5, 5, 11, 0),
        status:        "completed",
        chiefComplaint:"Persistent sneezing and runny nose for 2 weeks",
      },
      {
        ...base,
        doctorId:      limId,
        scheduledAt:   daysFromNow(-7, 11, 0),
        status:        "cancelled",
        chiefComplaint:"Stress and difficulty sleeping",
      },
    ]);

    // -- Health records --------------------------------------------------------
    await HealthRecord.insertMany([

      // Prescriptions
      {
        patientId,
        doctorId:      bustamId,
        appointmentId: pastMay15._id,
        type:          "prescription",
        issuedAt:      fixedDate(2026, 5, 15),
        medications: [
          { name: "Metformin",  dosage: "500mg", frequency: "Twice daily with meals", duration: "3 months" },
          { name: "Januvia",    dosage: "100mg", frequency: "Once daily",             duration: "3 months" },
        ],
      },
      {
        patientId,
        doctorId:      alcantaraId,
        appointmentId: pastMay5._id,
        type:          "prescription",
        issuedAt:      fixedDate(2026, 5, 5),
        medications: [
          { name: "Cetirizine",        dosage: "10mg", frequency: "Once daily at bedtime", duration: "30 days" },
          { name: "Fluticasone Nasal", dosage: "50mcg", frequency: "2 sprays each nostril, once daily", duration: "30 days" },
        ],
      },

      // Consultation Notes
      {
        patientId,
        doctorId:      bustamId,
        appointmentId: pastMay15._id,
        type:          "consultation_note",
        issuedAt:      fixedDate(2026, 5, 15),
        notes: "Patient presents for diabetes management follow-up. HbA1c at last check was 7.8%, slightly above target. Fasting blood glucose has been ranging between 130–160 mg/dL per patient-reported readings. Patient reports good adherence to Metformin but admits to inconsistent dietary compliance on weekends. Adding Januvia 100mg once daily to improve glycemic control. Reinforced importance of carbohydrate monitoring and encouraged daily 30-minute walks. Repeat HbA1c and fasting glucose in 3 months.",
      },
      {
        patientId,
        doctorId:      reyesId,
        appointmentId: pastMay20._id,
        type:          "consultation_note",
        issuedAt:      fixedDate(2026, 5, 20),
        notes: "Patient came in for annual check-up. Vitals stable — BP 124/82 mmHg, HR 76 bpm, BMI 23.4. No acute complaints. Patient reports occasional fatigue in the afternoons, likely related to disrupted sleep schedule. Advised regular sleep hygiene and hydration. Ordered CBC and lipid panel as part of annual workup. Patient is up to date on vaccinations. Follow-up in 12 months unless issues arise sooner.",
      },

      // Lab Requests
      {
        patientId,
        doctorId:      reyesId,
        appointmentId: pastMay20._id,
        type:          "lab_request",
        issuedAt:      fixedDate(2026, 5, 20),
        tests: [
          { name: "Complete Blood Count (CBC)" },
          { name: "Urinalysis" },
          { name: "Fasting Blood Glucose" },
        ],
      },
      {
        patientId,
        doctorId:      bustamId,
        appointmentId: pastMay15._id,
        type:          "lab_request",
        issuedAt:      fixedDate(2026, 5, 15),
        tests: [
          { name: "HbA1c (Glycated Hemoglobin)" },
          { name: "Lipid Panel (Total Cholesterol, LDL, HDL, Triglycerides)" },
          { name: "Kidney Function Test (Creatinine, eGFR)" },
          { name: "Liver Function Test (ALT, AST)" },
        ],
      },

      // Medical Certificate
      {
        patientId,
        doctorId:      reyesId,
        appointmentId: pastMay20._id,
        type:          "medical_certificate",
        issuedAt:      fixedDate(2026, 5, 20),
        purpose: "For work clearance — patient was examined on the above date and is found to be in generally good health and fit to return to full office duties without restriction.",
      },

      // Referral
      {
        patientId,
        doctorId:      bustamId,
        appointmentId: pastMay15._id,
        type:          "referral",
        issuedAt:      fixedDate(2026, 5, 15),
        referredTo:    "Cardiology",
        referralReason:"Patient reports intermittent chest tightness during physical exertion over the past month. Resting ECG shows borderline changes. Referred to Cardiology for further evaluation including stress test and echocardiogram to rule out coronary artery disease.",
      },
    ]);

    return NextResponse.json({
      success:       true,
      consultations: 6,
      healthRecords: 8,
      message:       "Seeded 6 consultations and 8 health records for patient@test.com",
    });

  } catch (err) {
    console.error("[seed/test-accounts POST]", err);
    return NextResponse.json({ error: "Seed failed", detail: String(err) }, { status: 500 });
  }
}

// -- PATCH — seed doctor@test.com consultations and health records ---------------

export async function PATCH() {
  try {
    await dbConnect();

    const doctor = await User.findOne({ email: "doctor@test.com" }).lean() as
      { _id: mongoose.Types.ObjectId } | null;
    if (!doctor) return NextResponse.json({ error: "Run GET first" }, { status: 400 });

    const patient = await User.findOne({ email: "patient@test.com" }).lean() as
      { _id: mongoose.Types.ObjectId } | null;
    if (!patient) return NextResponse.json({ error: "Run GET first to create patient@test.com" }, { status: 400 });

    const doctorId  = doctor._id;
    const patientId = patient._id;

    // -- Wipe existing doctor appointments + records ---------------------------
    const existingAppts = await Appointment.find({ doctorId }).select("_id").lean() as { _id: mongoose.Types.ObjectId }[];
    const apptIds = existingAppts.map(a => a._id);
    await HealthRecord.deleteMany({ appointmentId: { $in: apptIds } });
    await Appointment.deleteMany({ doctorId });

    // -- Date helpers ----------------------------------------------------------
    function today(hour: number, minute = 0) {
      const d = new Date();
      d.setHours(hour, minute, 0, 0);
      return d;
    }
    function fromNow(daysOffset: number, hour: number, minute = 0) {
      const d = new Date();
      d.setDate(d.getDate() + daysOffset);
      d.setHours(hour, minute, 0, 0);
      return d;
    }

    const base = {
      doctorId,
      patientId,
      forSelf:          false,
      consultationType: "video" as const,
      durationMinutes:  30,
      paymentStatus:    "paid",
    };

    // -- Today's consultations -------------------------------------------------
    await Appointment.insertMany([
      {
        ...base,
        patientName:    "Juan dela Cruz",
        scheduledAt:    today(10, 0),
        status:         "confirmed",
        chiefComplaint: "Recurring headaches and dizziness for 2 weeks",
      },
      {
        ...base,
        patientName:    "Maria Santos",
        scheduledAt:    today(14, 0),
        status:         "confirmed",
        chiefComplaint: "Follow-up for hypertension management",
      },
    ]);

    // -- Upcoming consultations ------------------------------------------------
    await Appointment.insertMany([
      {
        ...base,
        patientName:    "Ana Reyes",
        scheduledAt:    fromNow(1, 9, 0),
        status:         "confirmed",
        chiefComplaint: "Severe menstrual cramps",
      },
      {
        ...base,
        patientName:    "Roberto Cruz",
        scheduledAt:    fromNow(2, 11, 0),
        status:         "confirmed",
        chiefComplaint: "Skin rash on left arm",
      },
      {
        ...base,
        patientName:    "Liza Gomez",
        scheduledAt:    fromNow(4, 15, 0),
        status:         "confirmed",
        chiefComplaint: "Annual physical checkup",
      },
    ]);

    // -- Past consultations (completed, this month for earnings) ---------------
    const [pastBenito, pastCelia, pastRamon, pastLuisa, pastDante] = await Appointment.insertMany([
      {
        ...base,
        patientName:    "Benito Aquino",
        scheduledAt:    fromNow(-2, 10, 0),
        status:         "completed",
        chiefComplaint: "Persistent cough and mild fever for 5 days",
      },
      {
        ...base,
        patientName:    "Celia Fernandez",
        scheduledAt:    fromNow(-4, 14, 30),
        status:         "completed",
        chiefComplaint: "Type 2 diabetes management and medication review",
      },
      {
        ...base,
        patientName:    "Ramon Villanueva",
        scheduledAt:    fromNow(-6, 9, 0),
        status:         "completed",
        chiefComplaint: "Lower back pain radiating to left leg",
      },
      {
        ...base,
        patientName:    "Luisa Bautista",
        scheduledAt:    fromNow(-8, 11, 0),
        status:         "completed",
        chiefComplaint: "Routine prenatal check-up at 28 weeks",
      },
      {
        ...base,
        patientName:    "Dante Ocampo",
        scheduledAt:    fromNow(-10, 15, 0),
        status:         "completed",
        chiefComplaint: "Hypertension follow-up and lipid panel review",
      },
    ]);

    // -- Health records for past consultations ---------------------------------
    await HealthRecord.insertMany([

      // Benito Aquino — consultation note + prescription
      {
        patientId, doctorId, appointmentId: pastBenito._id,
        type:     "consultation_note",
        issuedAt: pastBenito.scheduledAt,
        notes:    "Patient presents with productive cough, low-grade fever (37.8°C), and mild pharyngitis of 5 days duration. Lungs are clear to auscultation bilaterally with no wheeze or crackles. Assessment is acute upper respiratory tract infection, likely viral in origin. Advised adequate hydration, rest, and symptomatic management. Antibiotics not indicated at this time. Patient instructed to return if fever persists beyond 3 days or if symptoms worsen.",
      },
      {
        patientId, doctorId, appointmentId: pastBenito._id,
        type:     "prescription",
        issuedAt: pastBenito.scheduledAt,
        medications: [
          { name: "Paracetamol (Biogesic)",    dosage: "500mg", frequency: "Every 6 hours as needed for fever or pain", duration: "5 days" },
          { name: "Guaifenesin (Robitussin)",  dosage: "100mg/5mL", frequency: "10mL every 4 hours for cough",         duration: "5 days" },
          { name: "Ascorbic Acid (Vitamin C)", dosage: "500mg", frequency: "Once daily after meals",                   duration: "2 weeks" },
        ],
      },

      // Celia Fernandez — consultation note + prescription + lab request
      {
        patientId, doctorId, appointmentId: pastCelia._id,
        type:     "consultation_note",
        issuedAt: pastCelia.scheduledAt,
        notes:    "Patient is a known Type 2 diabetic, here for quarterly follow-up. Self-monitored fasting blood glucose readings have been ranging 140–180 mg/dL, above target of <130. Reports good adherence to Metformin but admits to dietary lapses during weekends. BP is 128/84 mmHg. Weight stable at 72 kg. HbA1c result pending. Adjusted Metformin dose upward and counseled on low-glycemic diet. Emphasized the importance of daily glucose monitoring. Repeat labs in 3 months.",
      },
      {
        patientId, doctorId, appointmentId: pastCelia._id,
        type:     "prescription",
        issuedAt: pastCelia.scheduledAt,
        medications: [
          { name: "Metformin (Glucophage)",  dosage: "1000mg", frequency: "Twice daily with meals",  duration: "3 months" },
          { name: "Glimepiride (Amaryl)",    dosage: "2mg",    frequency: "Once daily before breakfast", duration: "3 months" },
          { name: "Losartan (Cozaar)",       dosage: "50mg",   frequency: "Once daily",               duration: "3 months" },
        ],
      },
      {
        patientId, doctorId, appointmentId: pastCelia._id,
        type:     "lab_request",
        issuedAt: pastCelia.scheduledAt,
        tests: [
          { name: "HbA1c (Glycated Hemoglobin)" },
          { name: "Fasting Blood Glucose" },
          { name: "Lipid Panel (Cholesterol, LDL, HDL, Triglycerides)" },
          { name: "Kidney Function Test (Creatinine, eGFR)" },
        ],
      },

      // Ramon Villanueva — consultation note + prescription
      {
        patientId, doctorId, appointmentId: pastRamon._id,
        type:     "consultation_note",
        issuedAt: pastRamon.scheduledAt,
        notes:    "Patient reports a 2-week history of lower back pain radiating to the left leg with occasional numbness. Pain is worse with prolonged sitting and improves with walking. No bowel or bladder symptoms. Neurological exam reveals mild decreased sensation over the L4 dermatome. Working diagnosis is lumbar radiculopathy, likely L4–L5 disc involvement. Prescribed NSAID analgesia and muscle relaxant. Referred to physical therapy for core strengthening. MRI of the lumbar spine ordered. Advised to avoid heavy lifting.",
      },
      {
        patientId, doctorId, appointmentId: pastRamon._id,
        type:     "prescription",
        issuedAt: pastRamon.scheduledAt,
        medications: [
          { name: "Celecoxib (Celebrex)",       dosage: "200mg", frequency: "Once daily after meals",            duration: "2 weeks" },
          { name: "Methocarbamol (Robaxin)",     dosage: "500mg", frequency: "Three times daily as needed",      duration: "1 week" },
          { name: "Pregabalin (Lyrica)",         dosage: "75mg",  frequency: "Twice daily for neuropathic pain", duration: "4 weeks" },
        ],
      },

      // Luisa Bautista — consultation note + prescription + lab request
      {
        patientId, doctorId, appointmentId: pastLuisa._id,
        type:     "consultation_note",
        issuedAt: pastLuisa.scheduledAt,
        notes:    "Patient is a 28-year-old primigravida at 28 weeks AOG here for routine prenatal check-up. Fetal heart tones heard at 148 bpm. Fundic height is 28 cm, appropriate for gestational age. BP 118/76 mmHg. Mild pedal edema noted, advised to elevate feet and reduce salt intake. Patient reports good fetal movement. No vaginal bleeding or leakage. Iron and folic acid supplementation ongoing. Glucose challenge test (GCT) ordered to screen for gestational diabetes. Next visit in 4 weeks.",
      },
      {
        patientId, doctorId, appointmentId: pastLuisa._id,
        type:     "prescription",
        issuedAt: pastLuisa.scheduledAt,
        medications: [
          { name: "Ferrous Sulfate + Folic Acid (Obimin)", dosage: "1 tablet", frequency: "Once daily after breakfast", duration: "Continue until delivery" },
          { name: "Calcium Carbonate",                     dosage: "500mg",    frequency: "Twice daily after meals",    duration: "Continue until delivery" },
        ],
      },
      {
        patientId, doctorId, appointmentId: pastLuisa._id,
        type:     "lab_request",
        issuedAt: pastLuisa.scheduledAt,
        tests: [
          { name: "Glucose Challenge Test (GCT) — 50g oral glucose load" },
          { name: "Complete Blood Count (CBC)" },
          { name: "Urinalysis" },
          { name: "Obstetric Ultrasound (3rd Trimester)" },
        ],
      },

      // Dante Ocampo — consultation note + prescription
      {
        patientId, doctorId, appointmentId: pastDante._id,
        type:     "consultation_note",
        issuedAt: pastDante.scheduledAt,
        notes:    "Patient is a 55-year-old male with a 10-year history of hypertension presenting for follow-up. BP today is 148/92 mmHg despite reported compliance with Amlodipine 5mg. Lipid panel from last month showed LDL at 162 mg/dL, above the target of <130. Patient reports mild ankle edema which may be a side effect of the calcium channel blocker. Plan to uptitrate Amlodipine and add Rosuvastatin for dyslipidemia. Discussed cardiovascular risk modification including smoking cessation and a low-sodium diet. Follow-up in 6 weeks with repeat BP monitoring.",
      },
      {
        patientId, doctorId, appointmentId: pastDante._id,
        type:     "prescription",
        issuedAt: pastDante.scheduledAt,
        medications: [
          { name: "Amlodipine (Norvasc)",      dosage: "10mg", frequency: "Once daily",                                duration: "3 months" },
          { name: "Rosuvastatin (Crestor)",    dosage: "20mg", frequency: "Once daily at bedtime",                     duration: "3 months" },
          { name: "Aspirin (low-dose)",         dosage: "80mg", frequency: "Once daily after breakfast",               duration: "Ongoing" },
        ],
      },
    ]);

    // -- Flag today's appointments on Juan (for visible dashboard testing) -----
    // (already done above via today(10,0) and today(14,0))

    return NextResponse.json({
      success: true,
      message: "Seeded doctor@test.com with 2 today + 3 upcoming + 5 past consultations and health records",
      todayConsultations:    2,
      upcomingConsultations: 3,
      pastConsultations:     5,
      healthRecords:         15,
      estimatedEarningsThisMonth: `₱${(5 * 800).toLocaleString("en-PH")}`,
    });

  } catch (err) {
    console.error("[seed/test-accounts PATCH]", err);
    return NextResponse.json({ error: "Seed failed", detail: String(err) }, { status: 500 });
  }
}
