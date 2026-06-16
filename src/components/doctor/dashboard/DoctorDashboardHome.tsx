"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Calendar, Users, TrendingUp, Clock, Video } from "lucide-react";
import { format } from "date-fns";
import { TodaySchedule, TodayScheduleSkeleton } from "./TodaySchedule";

// -- Types ---------------------------------------------------------------------

interface Stats {
  consultationsThisWeek: number;
  totalPatients:         number;
  earningsThisMonth:     number;
}

interface Appt {
  id:              string;
  patientName:     string;
  scheduledAt:     string;
  durationMinutes: number;
  status:          string;
  chiefComplaint:  string | null;
}

const ANIM = { animationDuration: "400ms" };

// -- Greeting ------------------------------------------------------------------

function getGreeting(name: string): { line: string; sub: string } {
  const hour = new Date().getHours();
  const first = name.split(" ")[0];
  const dr = `Dr. ${first}`;

  if (hour < 7)  return { line: `Early start, ${dr}.`,     sub: "Your patients are lucky." };
  if (hour < 12) return { line: `Good morning, ${dr}.`,    sub: "Here's how your day is looking." };
  if (hour < 18) return { line: `Good afternoon, ${dr}.`,  sub: "Here's how your day is looking." };
  if (hour < 21) return { line: `Good evening, ${dr}.`,    sub: "Almost done for the day." };
  return              { line: `Late night, ${dr}.`,         sub: "Don't forget to rest too." };
}

// -- Stat card -----------------------------------------------------------------

function StatCard({
  icon: Icon,
  iconColor,
  iconBg,
  label,
  sub,
  value,
  loading,
}: {
  icon:      React.ElementType;
  iconColor: string;
  iconBg:    string;
  label:     string;
  sub:       string;
  value:     string;
  loading:   boolean;
}) {
  return (
    <div className="bg-bg-main rounded-xl border border-elements p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-[16px] text-text-sub">{label}</p>
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${iconBg}`}>
          <Icon size={16} strokeWidth={1.75} className={iconColor} />
        </div>
      </div>
      {loading ? (
        <div className="h-8 w-24 rounded-lg bg-elements/60 animate-pulse" />
      ) : (
        <p className="text-[32px] font-medium text-text-main leading-none">
          {value}
        </p>
      )}
      <p className="text-[16px] text-text-sub -mt-2">{sub}</p>
    </div>
  );
}

// -- Upcoming card -------------------------------------------------------------

function UpcomingCard({ appt }: { appt: Appt }) {
  const router = useRouter();
  const date   = new Date(appt.scheduledAt);
  const diffMs = date.getTime() - Date.now();
  const canStart = appt.status === "ongoing" || diffMs <= 30 * 60_000;
  const isThisYear = date.getFullYear() === new Date().getFullYear();
  const dateLabel = format(date, isThisYear ? "EEEE, MMM d" : "EEEE, MMM d, yyyy");
  const timeLabel = format(date, "h:mm aa");

  return (
    <div className="bg-bg-main rounded-xl border border-elements flex flex-col overflow-hidden
      hover:shadow-sm transition-shadow duration-200 animate-fadeInDown">
      <div className="p-5 flex flex-col gap-4">
        {/* Avatar + name */}
        <div className="flex items-center gap-3">
          <div className="w-13 h-13 rounded-full bg-brand-sub flex items-center justify-center shrink-0">
            <span className="text-[13px] font-medium text-brand select-none">
              {appt.patientName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
            </span>
          </div>
          <p className="text-[16px] font-medium text-text-main truncate">{appt.patientName}</p>
        </div>
        <div className="flex flex-col gap-1.5">
          {/* Date + time */}
          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-text-sub shrink-0" strokeWidth={1.75} />
            <span className="text-[16px]">
              <span className="text-text-main">{dateLabel}</span>
              <span className="text-text-sub">, at </span>
              <span className="text-text-main">{timeLabel}</span>
            </span>
          </div>
          {/* Chief complaint */}
          {appt.chiefComplaint && (
            <p className="text-[16px] text-text-sub">&ldquo;{appt.chiefComplaint}&rdquo;</p>
          )}
        </div>
      </div>
      {/* Footer */}
      <div className="flex border-t border-elements">
        <button
          type="button"
          disabled={!canStart}
          onClick={() => canStart && router.push(`/doctor/consultations/${appt.id}/waiting-room`)}
          className={`flex-1 py-2.5 flex items-center justify-center gap-2
            text-[16px] font-medium transition-colors duration-200
            ${canStart
              ? "text-text-main hover:bg-bg-sub cursor-pointer"
              : "text-text-sub cursor-not-allowed"
            }`}
        >
          <Video size={14} strokeWidth={1.75} />
          Start session
        </button>
      </div>
    </div>
  );
}

function UpcomingCardSkeleton() {
  return (
    <div className="bg-bg-main rounded-xl border border-elements p-4 flex flex-col gap-3 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-elements/60 shrink-0" />
        <div className="flex flex-col gap-1.5 flex-1">
          <div className="h-4 w-32 rounded bg-elements/60" />
          <div className="h-3 w-24 rounded bg-elements/40" />
        </div>
      </div>
      <div className="h-3 w-40 rounded bg-elements/40" />
    </div>
  );
}

// -- Main component ------------------------------------------------------------

export function DoctorDashboardHome() {
  const { data: session } = useSession();
  const name = session?.user?.name ?? "Doctor";
  const { line, sub } = getGreeting(name);

  const [stats,        setStats]        = useState<Stats | null>(null);
  const [todayAppts,   setTodayAppts]   = useState<Appt[]>([]);
  const [upcoming,     setUpcoming]     = useState<Appt[]>([]);
  const [loading,      setLoading]      = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res  = await fetch("/api/doctor/dashboard");
        const data = await res.json() as {
          stats:         Stats;
          todaySchedule: Appt[];
          upcoming:      Appt[];
        };
        setStats(data.stats);
        setTodayAppts(data.todaySchedule);
        setUpcoming(data.upcoming);
      } catch {}
      finally { setLoading(false); }
    }
    load();
  }, []);

  return (
    <div className="flex flex-col gap-8 w-full flex-1">

      {/* -- Greeting -------------------------------------------------------- */}
      <div className="animate-fadeInDown" style={{ animationDelay: "50ms", ...ANIM }}>
        <h1 className="text-[28px] font-medium text-text-main">{line}</h1>
        <p className="text-[16px] text-text-sub mt-1">{sub}</p>
      </div>

      {/* -- Stats ----------------------------------------------------------- */}
      <div
        className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-fadeInDown"
        style={{ animationDelay: "100ms", ...ANIM }}
      >
        <StatCard
          icon={Calendar}
          iconColor="text-brand"
          iconBg="bg-brand-sub"
          label="Consultations"
          sub="This week"
          value={stats?.consultationsThisWeek.toString() ?? "—"}
          loading={loading}
        />
        <StatCard
          icon={Users}
          iconColor="text-violet-600"
          iconBg="bg-violet-50"
          label="Total patients"
          sub="All time"
          value={stats?.totalPatients.toString() ?? "—"}
          loading={loading}
        />
        <StatCard
          icon={TrendingUp}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
          label="Earnings"
          sub="This month"
          value={stats ? `₱${stats.earningsThisMonth.toLocaleString("en-PH")}` : "—"}
          loading={loading}
        />
      </div>

      {/* -- Today's schedule ----------------------------------------------- */}
      <div
        className="flex flex-col gap-3 animate-fadeInDown"
        style={{ animationDelay: "160ms", ...ANIM }}
      >
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[18px] font-medium text-text-main">Today&apos;s schedule</p>
            <p className="text-[16px] text-text-sub mt-1.5">Here are all your appointments for today. The red line shows where you are right now.</p>
          </div>
          <div className="flex items-center gap-1.5 text-[16px] text-text-main shrink-0">
            <Clock size={13} strokeWidth={1.75} />
            {format(new Date(), "EEEE, MMMM d")}
          </div>
        </div>
        {loading
          ? <TodayScheduleSkeleton />
          : <TodaySchedule appointments={todayAppts} />
        }
      </div>

      {/* -- Upcoming -------------------------------------------------------- */}
      {(loading || upcoming.length > 0) && (
        <div
          className="flex flex-col gap-3 animate-fadeInDown"
          style={{ animationDelay: "220ms", ...ANIM }}
        >
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[18px] font-medium text-text-main">Upcoming consultations</p>
              <p className="text-[16px] text-text-sub mt-1.5">What&apos;s coming up in the next few days.</p>
            </div>
            <Link
              href="/doctor/consultations"
              className="text-[16px] text-text-main hover:text-text-sub transition-colors duration-200 shrink-0"
            >
              View all →
            </Link>
          </div>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[0, 1, 2].map(i => <UpcomingCardSkeleton key={i} />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcoming.map(a => <UpcomingCard key={a.id} appt={a} />)}
            </div>
          )}
        </div>
      )}

      {/* Attribution */}
      <p className="mt-auto text-[12px] text-text-sub text-center animate-fadeInDown"
        style={{ animationDelay: "260ms", ...ANIM }}>
        © 2026 SwiftCare by{" "}
        <a href="https://theaverah.vercel.app" target="_blank" rel="noopener noreferrer" className="hover:underline">
          Thea
        </a>
        . All rights reserved.
      </p>

    </div>
  );
}
