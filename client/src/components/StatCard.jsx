
import {
  Users,
  UserCheck,
  CalendarDays,
  BriefcaseBusiness,
  ArrowUpRight,
} from "lucide-react";

const iconMap = {
  users: Users,
  "user-check": UserCheck,
  "calendar-days": CalendarDays,
  "briefcase-business": BriefcaseBusiness,
};

export default function StatCard({ stat }) {
  const Icon = iconMap[stat.icon] || Users;

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{stat.title}</p>
          <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
            {stat.value}
          </p>
        </div>

        <div className={`rounded-xl p-3 ${stat.iconStyle}`}>
          <Icon size={21} />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 font-semibold text-emerald-700">
          <ArrowUpRight size={13} />
          {stat.change}
        </span>
        <span className="text-slate-500">{stat.description}</span>
      </div>
    </article>
  );
}
