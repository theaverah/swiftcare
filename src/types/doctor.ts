export interface DoctorAvailability {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

export interface Doctor {
  doctorProfileId: string;
  userId: string;
  name: string;
  profileImage: string | null;
  specializations: string[];
  consultationFee: number | null;
  languages: string[];
  yearsOfExperience: number | null;
  licenseNumber: string | null;
  bio: string | null;
  rating: number;
  totalReviews: number;
  availability: DoctorAvailability[];
  nextAvailableLabel: string;
  isAvailableToday: boolean;
  todayHours: string | null;
  isSaved: boolean;
}
