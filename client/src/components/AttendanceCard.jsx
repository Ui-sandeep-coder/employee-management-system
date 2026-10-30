
import { Clock3, CheckCircle2, XCircle, CalendarDays } from "lucide-react";

const attendanceItems = [
  {
    label: "Present",
    value: 221,
    icon: CheckCircle2,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
  {
    label: "On Leave",
    value: 18,
    icon: CalendarDays,
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
  {
    label: "Absent",
    value: 9,
    icon: XCircle,
    color: "text-rose-600",
    bg: "bg-rose-50",
  },
];

export default function AttendanceCard() {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-bold text-slate-900">Today's Attendance</h3>
          <p className="mt-1 text-sm text-slate-500">
            Daily workforce status
          </p>
        </div>

        <span className="rounded-lg bg-indigo-50 p-2 text-indigo-600">
          <Clock3 size={19} />
        </span>
      </div>

      <div className="mt-6 rounded-xl bg-slate-50 p-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-sm text-slate-500">Attendance rate</p>
            <p className="mt-1 text-3xl font-bold text-slate-900">89.1%</p>
          </div>
          <span className="text-xs font-medium text-emerald-700">
            221 of 248
          </span>
        </div>

        <div
          className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-200"
          role="progressbar"
          aria-label="Attendance rate"
          aria-valuenow={89.1}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div className="h-full w-[89.1%] rounded-full bg-indigo-600" />
        </div>
      </div>

      <div className="mt-5 space-y-4">
        {attendanceItems.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className={`rounded-lg p-2 ${bg} ${color}`}>
                <Icon size={18} />
              </span>
              <span className="text-sm text-slate-600">{label}</span>
            </div>
            <span className="text-sm font-semibold text-slate-900">
              {value}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
