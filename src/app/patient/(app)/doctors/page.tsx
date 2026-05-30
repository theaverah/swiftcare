import { Suspense } from "react";
import { FindDoctorsPage } from "@/components/patient/doctors/FindDoctorsPage";

export const metadata = { title: "Find a Doctor" };

export default function DoctorsPage() {
  return (
    <Suspense>
      <FindDoctorsPage />
    </Suspense>
  );
}
