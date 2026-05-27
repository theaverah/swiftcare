import Link from "next/link";

export const metadata = {
  title: "SwiftCare — Healthcare, Simplified",
};

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-bg-main px-6">
      <div className="max-w-lg text-center animate-fadeInDown">
        <span className="text-[28px] font-bold tracking-tight text-text-main">
          Swift<span className="text-brand">Care</span>
        </span>
        <h1 className="mt-6 text-[40px] font-bold text-text-main leading-tight tracking-[-0.08em]">
          Healthcare,<br />on your schedule.
        </h1>
        <p className="mt-4 text-[16px] text-text-sub leading-relaxed">
          Connect with licensed doctors online. Book consultations, get
          prescriptions, and manage your health — all in one place.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link
            href="/register"
            className="px-5 py-3 bg-brand text-white rounded-lg text-[14px] font-medium hover:opacity-90 transition-opacity duration-base"
          >
            Get Started
          </Link>
          <Link
            href="/login"
            className="px-5 py-3 border border-elements text-text-main rounded-lg text-[14px] font-medium hover:bg-bg-sub transition-colors duration-base"
          >
            Sign In
          </Link>
        </div>
      </div>
    </main>
  );
}
