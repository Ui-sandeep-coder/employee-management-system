
import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";

export default function DashboardLayout({
  children,
  role,
  currentUser,
}) {
  const [activeNav, setActiveNav] = useState("Overview");
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (role === "employee") {
      setActiveNav("My Profile");
    } else {
      setActiveNav("Overview");
    }
  }, [role]);

  useEffect(() => {
  function openEmployees() {
    if (role === "admin" || role === "hr") {
      setActiveNav("Employees");
    }
  }

  window.addEventListener("peopleflow-open-employees", openEmployees);

  return () => {
    window.removeEventListener(
      "peopleflow-open-employees",
      openEmployees
    );
  };
}, [role]);

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar
        activeNav={activeNav}
        setActiveNav={setActiveNav}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        role={role}
      />

      <div className="min-h-screen lg:pl-64">
        <Header
          activeNav={activeNav}
          onMenuClick={() => setMobileOpen(true)}
          user={currentUser}
        />

        <main className="mx-auto max-w-[1600px] p-4 sm:p-6 lg:p-8">
          {typeof children === "function"
            ? children({ activeNav })
            : children}
        </main>
      </div>
    </div>
  );
}
