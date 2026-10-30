
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, ChevronDown, LogOut } from "lucide-react";

export default function Header({
  activeNav,
  onMenuClick,
  user,
}) {
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);

  const descriptions = {
    Overview: "Here's what's happening with your team today.",
    Employees: "View and manage your employee directory.",
    Departments: "Explore your organization's departments.",
    Attendance: "Keep track of today's attendance.",
    Settings: "Manage your workspace preferences.",
    "My Profile": "View your personal employee information.",
  };

  function handleLogout() {
    sessionStorage.removeItem("token");
    setProfileOpen(false);
    navigate("/login", { replace: true });
  }

  const fullName = user?.full_name || user?.name || "User";

  const roleLabels = {
    admin: "Administrator",
    hr: "HR Manager",
    employee: "Employee",
  };

  const role =
    roleLabels[user?.role?.toLowerCase()] || "Account";

  const initials = fullName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="flex min-h-20 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onMenuClick}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
            aria-label="Open menu"
          >
            <Menu size={21} />
          </button>

          <div className="min-w-0">
            <h2 className="truncate text-xl font-bold text-slate-900 sm:text-2xl">
              {activeNav}
            </h2>

            <p className="mt-1 hidden text-sm text-slate-500 sm:block">
              {descriptions[activeNav] || descriptions.Overview}
            </p>
          </div>
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() =>
              setProfileOpen((previous) => !previous)
            }
            aria-expanded={profileOpen}
            aria-haspopup="menu"
            className="flex items-center gap-2 rounded-xl p-1.5 hover:bg-slate-50"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">
              {initials}
            </div>

            <div className="hidden text-left sm:block">
              <p className="max-w-40 truncate text-sm font-semibold text-slate-800">
                {fullName}
              </p>

              <p className="text-xs text-slate-500">
                {role}
              </p>
            </div>

            <ChevronDown
              size={16}
              className={`hidden text-slate-400 transition-transform sm:block ${
                profileOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {profileOpen && (
            <div
              role="menu"
              className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-slate-200 bg-white p-2 shadow-lg"
            >
              <div className="border-b border-slate-100 px-3 py-2">
                <p className="truncate text-sm font-semibold text-slate-800">
                  {fullName}
                </p>

                <p className="text-xs text-slate-500">
                  {role}
                </p>

                {user?.email && (
                  <p className="mt-1 break-all text-xs text-slate-500">
                    {user.email}
                  </p>
                )}
              </div>

              <button
                type="button"
                role="menuitem"
                onClick={handleLogout}
                className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-rose-600 transition hover:bg-rose-50"
              >
                <LogOut size={17} />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
