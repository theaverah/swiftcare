export const metadata = { title: "Create Account" };

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-sub px-4">
      <div className="w-full max-w-[440px] bg-bg-main border border-elements rounded-lg p-8 shadow-[var(--shadow-md)] animate-fadeInDown">
        <div className="mb-8">
          <span className="text-[22px] font-bold tracking-tight text-text-main">
            Swift<span className="text-brand">Care</span>
          </span>
          <h1 className="mt-6 text-[24px] font-bold text-text-main">Create your account</h1>
          <p className="mt-1 text-[14px] text-text-sub">Join SwiftCare as a patient or doctor.</p>
        </div>
        {/* Registration form — built from Figma */}
        <p className="text-[13px] text-text-sub text-center mt-6">
          Already have an account?{" "}
          <a href="/login" className="text-brand hover:underline">Sign in</a>
        </p>
      </div>
    </div>
  );
}
