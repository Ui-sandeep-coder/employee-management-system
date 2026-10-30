
import { Users } from "lucide-react";
import { departmentData } from "../data/employees";

export default function WorkforceOverview() {
  const total = departmentData.reduce(
    (sum, department) => sum + department.count,
    0,
  );

  const gradient = departmentData.reduce(
    (result, department) => {
      const start = result.currentPercent;
      const end =
        start + (department.count / (total || 1)) * 100;

      return {
        currentPercent: end,
        stops: [
          ...result.stops,
          `${department.color} ${start}% ${end}%`,
        ],
      };
    },
    { currentPercent: 0, stops: [] },
  ).stops.join(", ");

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-bold text-slate-900">
            Workforce Overview
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Employees by department
          </p>
        </div>

        <span className="rounded-lg bg-slate-50 p-2 text-slate-500">
          <Users size={19} />
        </span>
      </div>

      <div className="mt-7 flex flex-col items-center gap-7 sm:flex-row sm:justify-around">
        <div
          className="relative flex h-44 w-44 shrink-0 items-center justify-center rounded-full"
          style={{
            background:
              total > 0
                ? `conic-gradient(${gradient})`
                : "#e2e8f0",
          }}
          role="img"
          aria-label={`Workforce distribution across departments, ${total} employees`}
        >
          <div className="flex h-28 w-28 flex-col items-center justify-center rounded-full bg-white">
            <span className="text-3xl font-bold text-slate-900">
              {total}
            </span>
            <span className="mt-1 text-xs text-slate-500">
              Employees
            </span>
          </div>
        </div>

        <div className="w-full space-y-4">
          {departmentData.map((department) => (
            <div
              key={department.name}
              className="flex items-center justify-between gap-3"
            >
              <div className="flex min-w-0 items-center gap-2">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: department.color }}
                />
                <span className="truncate text-sm text-slate-600">
                  {department.name}
                </span>
              </div>

              <span className="text-sm font-semibold text-slate-800">
                {department.count}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
