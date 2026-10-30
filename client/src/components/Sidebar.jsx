
import {
  LayoutDashboard,
  Users,
  X,
  BriefcaseBusiness,
  UserRound,
} from "lucide-react";

const navigationByRole = {
  admin: [
    { label: "Overview", icon: LayoutDashboard },
    { label: "Employees", icon: Users },
  ],
  hr: [
    { label: "Overview", icon: LayoutDashboard },
    { label: "Employees", icon: Users },
  ],
  employee: [
    { label: "My Profile", icon: UserRound },
  ],
};

export default function Sidebar({
  activeNav,
  setActiveNav,
  mobileOpen,
  setMobileOpen,
  role = "employee",
}) {
  const navigation =
    navigationByRole[role?.toLowerCase()] ??
    navigationByRole.employee;

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform duration-200 lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-20 items-center justify-between border-b border-slate-100 px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white">
              <BriefcaseBusiness size={22} />
            </div>

            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-900">
                PeopleFlow
              </h1>
              <p className="text-xs text-slate-500">
                People management
              </p>
            </div>
          </div>

          <button
            type="button"
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-4 pt-7">
          <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-widest text-slate-400">
            Workspace
          </p>

          <nav className="space-y-1">
            {navigation.map(({ label, icon: Icon }) => {
              const selected = activeNav === label;

              return (
                <button
                  type="button"
                  key={label}
                  onClick={() => {
                    setActiveNav(label);
                    setMobileOpen(false);
                  }}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
                    selected
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <Icon size={19} />
                  <span>{label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="mt-auto border-t border-slate-100 p-4">
          <p className="text-center text-xs text-slate-400">
            PeopleFlow
          </p>
        </div>
      </aside>
    </>
  );
}
