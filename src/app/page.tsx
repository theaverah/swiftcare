import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { LandingPage } from "@/components/landing/LandingPage";

export const metadata = {
  title: "SwiftCare — Healthcare that comes to you",
  description:
    "Connect with licensed Filipino doctors online. Describe what you're feeling, and we'll find the right doctor for you.",
};

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  if (session?.user) {
    const role = (session.user as { role?: string }).role;
    redirect(role === "doctor" ? "/doctor/dashboard" : "/patient/dashboard");
  }

  return <LandingPage />;
}
