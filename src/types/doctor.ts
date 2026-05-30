export interface DoctorAvailability {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

export interface Doctor {
  doctorProfileId:  string;
  userId:           string;
  name:             string;
  profileImage:     string | null;
  specializations:  string[];
  consultationFee:  number | null;
  languages:        string[];
  city:             string | null;
  yearsOfExperience:number | null;
  licenseNumber:    string | null;
  bio:              string | null;
  education:        { medicalSchool: string; residency: string } | null;
  certifications:   string[];
  affiliations:     string[];
  rating:           number;
  totalReviews:     number;
  availability:     DoctorAvailability[];
  nextAvailableLabel: string;
  isAvailableToday: boolean;
  todayHours:       string | null;
  isSaved:          boolean;
}
