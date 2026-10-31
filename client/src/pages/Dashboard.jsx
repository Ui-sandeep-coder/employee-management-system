
import { useEffect, useState } from "react";
import {
  CalendarDays,
  Users,
  Building2,
  UserRound,
  UserPlus,
} from "lucide-react";

import AddHRModal from "../components/AddHRModal";
import DashboardLayout from "../layouts/DashboardLayout";
import EmployeeTable from "../components/EmployeeTable";
import AddEmployeeModal from "../components/AddEmployeeModal";
import DeleteEmployeeModal from "../components/DeleteEmployeeModal";
import ResetHRPasswordModal from "../components/ResetHRPasswordModal";

import api from "../services/api";

const PAGE_SIZE = 10;

const avatarColors = [
  "bg-blue-100 text-blue-700",
  "bg-pink-100 text-pink-700",
  "bg-amber-100 text-amber-700",
  "bg-purple-100 text-purple-700",
  "bg-emerald-100 text-emerald-700",
  "bg-cyan-100 text-cyan-700",
];

function formatDate(date) {
  if (!date) return "—";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return "—";

  return parsedDate.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

function mapEmployee(employee, index) {
  const name = employee.full_name || employee.name || "Unknown";

  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return {
    ...employee,
    id: employee.id,
    name,
    role: employee.job_title || employee.role || "—",
    joined: formatDate(employee.joining_date || employee.joined),
    initials,
    color: avatarColors[index % avatarColors.length],
    status: employee.status || "Active",
  };
}

export default function Dashboard() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [currentUser, setCurrentUser] = useState(null);
  const [roleLoading, setRoleLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [addingEmployee, setAddingEmployee] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [department, setDepartment] = useState("All Departments");

  const [refreshKey, setRefreshKey] = useState(0);

  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [updatingEmployee, setUpdatingEmployee] = useState(false);

  const [employeeToDelete, setEmployeeToDelete] = useState(null);
  const [deletingEmployee, setDeletingEmployee] = useState(false);

  const [myProfile, setMyProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [editingProfile, setEditingProfile] = useState(false);

  const [hrModalOpen, setHrModalOpen] = useState(false);
  const [creatingHR, setCreatingHR] = useState(false);

  const [hrEmployees, setHrEmployees] = useState([]);
  const [hrLoading, setHrLoading] = useState(false);
  const [hrError, setHrError] = useState("");
  const [hrRefreshKey, setHrRefreshKey] = useState(0);

  const [employeeView, setEmployeeView] = useState("employees");

  const [selectedHR, setSelectedHR] = useState(null);
  const [resettingHR, setResettingHR] = useState(false);

  const role = currentUser?.role?.toLowerCase() || "";
  const canManageEmployees = role === "admin" || role === "hr";

  // Logged-in user ki details fetch karo.
  useEffect(() => {
    let cancelled = false;

    async function fetchCurrentUser() {
      try {
        const response = await api.get("/auth/me");
        const payload = response.data;

        const user =
          payload?.data?.user ??
          payload?.data ??
          payload?.user ??
          payload;

        if (!user?.role) {
          throw new Error("User role response mein nahi mila.");
        }

        if (!cancelled) setCurrentUser(user);
      } catch (err) {
        if (!cancelled) {
          if (err.response?.status === 401) {
            sessionStorage.removeItem("token");
            window.location.replace("/login");
            return;
          }

          setError(
            err.response?.data?.message ||
              err.message ||
              "User details load nahi ho paayi."
          );
        }
      } finally {
        if (!cancelled) setRoleLoading(false);
      }
    }

    fetchCurrentUser();

    return () => {
      cancelled = true;
    };
  }, []);

  // Employee ki apni profile fetch karo.
  useEffect(() => {
    if (roleLoading || role !== "employee") return;

    let cancelled = false;

    async function fetchMyProfile() {
      try {
        setProfileLoading(true);
        setProfileError("");

        const response = await api.get("/employees/me");

        if (!cancelled) {
          const payload = response.data;
          setMyProfile(payload?.data?.employee ?? payload?.data ?? null);
        }
      } catch (err) {
        if (!cancelled) {
          setProfileError(
            err.response?.data?.message || "Unable to load your profile."
          );
        }
      } finally {
        if (!cancelled) setProfileLoading(false);
      }
    }

    fetchMyProfile();

    return () => {
      cancelled = true;
    };
  }, [role, roleLoading]);

  // Search ko 300ms debounce karo.
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [search]);

  // Employee directory sirf Admin aur HR ke liye.
  useEffect(() => {
    let cancelled = false;

    async function fetchEmployees() {
      if (roleLoading) return;

      if (!canManageEmployees) {
        setEmployees([]);
        setPagination(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const response = await api.get("/employees", {
          params: {
            page: currentPage,
            limit: PAGE_SIZE,
            search: debouncedSearch.trim(),
            department:
              department === "All Departments" ? "" : department,
          },
        });

        const payload = response.data;

        const records = Array.isArray(payload.data)
          ? payload.data
          : Array.isArray(payload.data?.employees)
            ? payload.data.employees
            : null;

        if (!records) {
          throw new Error("Unexpected employee API response format.");
        }

        if (!payload.pagination) {
          throw new Error("Pagination information is missing.");
        }

        if (!cancelled) {
          setEmployees(records.map(mapEmployee));
          setPagination(payload.pagination);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err.response?.data?.message ||
              err.message ||
              "Employees load nahi ho paaye."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchEmployees();

    return () => {
      cancelled = true;
    };
  }, [
    role,
    roleLoading,
    canManageEmployees,
    currentPage,
    refreshKey,
    debouncedSearch,
    department,
  ]);

  // HR directory sirf Admin ke liye.
  useEffect(() => {
    if (roleLoading || role !== "admin") return;

    let cancelled = false;

    async function fetchHRList() {
      try {
        setHrLoading(true);
        setHrError("");

        const response = await api.get("/users/hr");
        const records = response.data?.data;

        if (!Array.isArray(records)) {
          throw new Error("Unexpected HR API response format.");
        }

        if (!cancelled) {
          setHrEmployees(records);
        }
      } catch (err) {
        if (!cancelled) {
          setHrError(
            err.response?.data?.message ||
              err.message ||
              "HR list load nahi ho paayi."
          );
        }
      } finally {
        if (!cancelled) setHrLoading(false);
      }
    }

    fetchHRList();

    return () => {
      cancelled = true;
    };
  }, [role, roleLoading, hrRefreshKey]);

  function handleSearchChange(value) {
    setSearch(value);
    setCurrentPage(1);
  }

  function handleDepartmentChange(value) {
    setDepartment(value);
    setCurrentPage(1);
  }

  function handleOpenAddModal() {
    setSelectedEmployee(null);
    setModalOpen(true);
  }

  function handleEditClick(employee) {
    setSelectedEmployee(employee);
    setModalOpen(true);
  }

  function handleCloseModal() {
    setModalOpen(false);
    setSelectedEmployee(null);
  }

  function handleDeleteClick(employee) {
    setEmployeeToDelete(employee);
  }

  function handleCloseDeleteModal() {
    if (deletingEmployee) return;
    setEmployeeToDelete(null);
  }

  async function handleConfirmDelete() {
    if (!employeeToDelete || deletingEmployee) return;

    try {
      setDeletingEmployee(true);

      await api.delete(`/employees/${employeeToDelete.id}`);

      setEmployeeToDelete(null);

      if (employees.length === 1 && currentPage > 1) {
        setCurrentPage((page) => page - 1);
      } else {
        setRefreshKey((previous) => previous + 1);
      }
    } catch (err) {
      alert(
        err.response?.data?.message ||
          "Employee delete nahi ho paaya. Please try again."
      );
    } finally {
      setDeletingEmployee(false);
    }
  }

  async function handleUpdateEmployee(id, form) {
    try {
      setUpdatingEmployee(true);

      await api.patch(`/employees/${id}`, {
        full_name: form.name,
        email: form.email,
        department: form.department,
        job_title: form.role,
      });

      handleCloseModal();
      setRefreshKey((previous) => previous + 1);
    } catch (err) {
      throw new Error(
        err.response?.data?.message ||
          "Employee update nahi ho paaya. Please try again.",
        { cause: err }
      );
    } finally {
      setUpdatingEmployee(false);
    }
  }

  async function handleAddEmployee(form) {
    try {
      setAddingEmployee(true);

      await api.post("/users/employee", {
        full_name: form.name,
        email: form.email,
        password: form.password,
        department: form.department,
        job_title: form.role,
      });

      setModalOpen(false);
      setCurrentPage(1);
      setRefreshKey((previous) => previous + 1);
    } catch (err) {
      throw new Error(
        err.response?.data?.message ||
          "Employee create nahi ho paaya. Please try again.",
        { cause: err }
      );
    } finally {
      setAddingEmployee(false);
    }
  }

  async function handleResetHRPassword(newPassword) {
  if (!selectedHR) return;

  try {
    setResettingHR(true);

    const response = await api.patch(
      `/users/hr/${selectedHR.id}/password`,
      {
        password: newPassword,
      }
    );

    alert(response.data.message || "HR password reset successfully.");

    setSelectedHR(null);
  } catch (error) {
    const message =
      error.response?.data?.message ||
      "Unable to reset HR password. Please try again.";

    alert(message);
  } finally {
    setResettingHR(false);
  }
}

  async function handleCreateHR(form) {
    try {
      setCreatingHR(true);

      await api.post("/users/hr", {
        full_name: form.name,
        email: form.email,
        password: form.password,
      });

      setHrModalOpen(false);
      setHrRefreshKey((previous) => previous + 1);

      alert("HR account created successfully!");
    } catch (err) {
      throw new Error(
        err.response?.data?.message || "Please try again.",
        { cause: err }
      );
    } finally {
      setCreatingHR(false);
    }
  }

  async function handleUpdateMyProfile(event) {
    event.preventDefault();

    if (!myProfile) return;

    const formData = new FormData(event.currentTarget);
    const full_name = String(formData.get("full_name") || "").trim();
    const phone = String(formData.get("phone") || "").trim();

    if (!full_name || !phone) {
      setProfileError("Full Name aur Phone dono required hain.");
      return;
    }

    try {
      setProfileError("");

      const response = await api.patch(`/employees/${myProfile.id}`, {
        full_name,
        phone,
      });

      const payload = response.data?.data;
      const updatedEmployee = payload?.employee ?? payload;

      setMyProfile((previous) => ({
        ...previous,
        ...updatedEmployee,
        full_name,
        phone,
      }));

      setEditingProfile(false);
    } catch (err) {
      setProfileError(
        err.response?.data?.message || "Please try again."
      );
    }
  }

  const totalPages = pagination?.totalPages ?? 0;
  const totalEmployees = pagination?.total ?? 0;

  const startItem =
    totalEmployees === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;

  const endItem = Math.min(currentPage * PAGE_SIZE, totalEmployees);

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const departmentsCount = new Set(
    employees.map((employee) => employee.department).filter(Boolean)
  ).size;

  if (roleLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-500">Loading your dashboard...</p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="rounded-xl border border-rose-200 bg-white p-6 text-center">
          <p className="font-semibold text-rose-700">
            Dashboard load nahi ho paaya
          </p>
          <p className="mt-2 text-sm text-slate-600">
            {error || "Current user details nahi mil paayi."}
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout role={role} currentUser={currentUser}>
      {({ activeNav }) => (
        <div className="space-y-7">
          {/* Page heading */}
          <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <CalendarDays size={16} />
                {today}
              </div>

              <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                {activeNav === "Overview"
                  ? `${role === "admin" ? "Admin" : "HR"} Overview`
                  : activeNav === "Employees"
                    ? employeeView === "hr" && role === "admin"
                      ? "HR Management"
                      : "Employee Directory"
                    : "My Profile"}
              </h1>

              <p className="mt-2 text-sm text-slate-500 sm:text-base">
                {activeNav === "Overview"
                  ? "Your workforce at a glance."
                  : activeNav === "Employees"
                    ? employeeView === "hr" && role === "admin"
                      ? "View and manage HR accounts."
                      : "Search, filter and manage employee records."
                    : `Welcome, ${currentUser.full_name || currentUser.name || "Employee"}.`}
              </p>
            </div>

            {/* Page action buttons */}
            {canManageEmployees && activeNav === "Employees" && (
              <div className="flex flex-wrap items-center gap-3">
                {role === "admin" && employeeView === "hr" && (
                  <button
                    type="button"
                    onClick={() => setHrModalOpen(true)}
                    className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-white px-4 py-2.5 text-sm font-medium text-indigo-700 hover:bg-indigo-50"
                  >
                    <UserPlus size={18} />
                    Add HR
                  </button>
                )}

                {employeeView === "employees" && (
                  <button
                    type="button"
                    onClick={handleOpenAddModal}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
                  >
                    <Users size={18} />
                    Add New Employee
                  </button>
                )}
              </div>
            )}
          </section>

          {/* ADMIN / HR: OVERVIEW */}
          {canManageEmployees && activeNav === "Overview" && (
            <section className="space-y-6">
              {error ? (
                <div className="rounded-xl border border-rose-200 bg-white p-5">
                  <p className="font-semibold text-rose-700">
                    Overview data load nahi ho paaya
                  </p>
                  <p className="mt-2 text-sm text-slate-600">{error}</p>
                  <button
                    type="button"
                    onClick={() => setRefreshKey((previous) => previous + 1)}
                    className="mt-3 rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white"
                  >
                    Retry
                  </button>
                </div>
              ) : (
                <>
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    <div className="rounded-2xl border border-slate-200 bg-white p-6">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-slate-500">
                          Total Employees
                        </p>
                        <Users className="text-indigo-600" size={22} />
                      </div>
                      <p className="mt-4 text-3xl font-bold text-slate-900">
                        {loading ? "…" : totalEmployees}
                      </p>
                      <p className="mt-2 text-sm text-slate-500">
                        Employee records in the directory
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-6">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-slate-500">Departments</p>
                        <Building2 className="text-indigo-600" size={22} />
                      </div>
                      <p className="mt-4 text-3xl font-bold text-slate-900">
                        {loading ? "…" : departmentsCount}
                      </p>
                      <p className="mt-2 text-sm text-slate-500">
                        Departments on the loaded page
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-6">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-slate-500">Your Account</p>
                        <UserRound className="text-indigo-600" size={22} />
                      </div>
                      <p className="mt-4 text-xl font-bold capitalize text-slate-900">
                        {role}
                      </p>
                      <p className="mt-2 text-sm text-slate-500">
                        {currentUser.full_name || currentUser.name}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-6">
                    <h2 className="text-lg font-bold text-slate-900">
                      Quick overview
                    </h2>
                    <p className="mt-2 text-sm text-slate-500">
                      Open Employees to search the directory, filter by
                      department, export the list or manage employee records.
                    </p>
                    <button
                      type="button"
                      onClick={() =>
                        window.dispatchEvent(
                          new CustomEvent("peopleflow-open-employees")
                        )
                      }
                      className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                    >
                      View Employees
                    </button>
                  </div>
                </>
              )}
            </section>
          )}

          {/* ADMIN / HR: EMPLOYEE DIRECTORY */}
          {canManageEmployees && activeNav === "Employees" && (
            <section>
              {/* Admin-only tabs */}
              {role === "admin" && (
                <div className="mb-6 flex gap-3 border-b border-slate-200">
                  <button
                    type="button"
                    onClick={() => setEmployeeView("employees")}
                    className={`border-b-2 px-4 py-3 text-sm font-medium ${
                      employeeView === "employees"
                        ? "border-indigo-600 text-indigo-600"
                        : "border-transparent text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Employee Management
                  </button>

                  <button
                    type="button"
                    onClick={() => setEmployeeView("hr")}
                    className={`border-b-2 px-4 py-3 text-sm font-medium ${
                      employeeView === "hr"
                        ? "border-indigo-600 text-indigo-600"
                        : "border-transparent text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    HR Management
                  </button>
                </div>
              )}

              {/* Employee Management */}
              {employeeView === "employees" && (
                loading ? (
                  <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
                    Loading employees...
                  </div>
                ) : error ? (
                  <div className="rounded-2xl border border-rose-200 bg-white p-6">
                    <p className="font-semibold text-rose-700">
                      Employees load nahi ho paaye
                    </p>
                    <p className="mt-2 text-sm text-slate-600">{error}</p>
                    <button
                      type="button"
                      onClick={() => setRefreshKey((previous) => previous + 1)}
                      className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                    >
                      Retry
                    </button>
                  </div>
                ) : (
                  <>
                    <EmployeeTable
                      employees={employees}
                      onAddClick={handleOpenAddModal}
                      onEditClick={handleEditClick}
                      onDelete={handleDeleteClick}
                      search={search}
                      onSearchChange={handleSearchChange}
                      department={department}
                      onDepartmentChange={handleDepartmentChange}
                      totalEmployees={totalEmployees}
                      loading={loading}
                    />

                    <div className="mt-5 flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-sm text-slate-500">
                        Showing {startItem}–{endItem} of {totalEmployees} employees
                      </p>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          disabled={!pagination?.hasPreviousPage || loading}
                          onClick={() =>
                            setCurrentPage((page) => Math.max(1, page - 1))
                          }
                          className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Previous
                        </button>

                        {Array.from(
                          { length: totalPages },
                          (_, index) => index + 1
                        ).map((page) => (
                          <button
                            key={page}
                            type="button"
                            aria-current={currentPage === page ? "page" : undefined}
                            disabled={loading}
                            onClick={() => setCurrentPage(page)}
                            className={`min-w-10 rounded-lg px-3 py-2 text-sm font-medium disabled:cursor-not-allowed ${
                              currentPage === page
                                ? "bg-indigo-600 text-white"
                                : "border border-slate-200 text-slate-700 hover:bg-slate-50"
                            }`}
                          >
                            {page}
                          </button>
                        ))}

                        <button
                          type="button"
                          disabled={!pagination?.hasNextPage || loading}
                          onClick={() => setCurrentPage((page) => page + 1)}
                          className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  </>
                )
              )}

              {/* HR Management - Admin only */}
              {role === "admin" && employeeView === "hr" && (
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                  <div className="border-b border-slate-200 px-6 py-4">
                    <h2 className="text-lg font-semibold text-slate-900">
                      HR Management
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      View all HR accounts in your organization.
                    </p>
                  </div>

                  {hrLoading ? (
                    <p className="p-6 text-sm text-slate-500">
                      Loading HR list...
                    </p>
                  ) : hrError ? (
                    <div className="p-6">
                      <p className="text-sm text-rose-600">{hrError}</p>
                      <button
                        type="button"
                        onClick={() =>
                          setHrRefreshKey((previous) => previous + 1)
                        }
                        className="mt-3 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white"
                      >
                        Retry
                      </button>
                    </div>
                  ) : hrEmployees.length === 0 ? (
                    <p className="p-6 text-sm text-slate-500">
                      No HR accounts found. Click Add HR to create one.
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-500">
                          <tr>
                            <th className="px-6 py-4 font-medium">Name</th>
                            <th className="px-6 py-4 font-medium">Email</th>
                            <th className="px-6 py-4 font-medium">Role</th>
                            <th className="px-6 py-4 font-medium">Status</th>
                            <th className="px-6 py-4 font-medium">Actions</th>
                            <th className="px-6 py-4 font-medium">Created</th>
                          </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100">
                          {hrEmployees.map((hr) => (
                            <tr key={hr.id}>
                              <td className="px-6 py-4 font-medium text-slate-900">
                                {hr.full_name}
                              </td>
                              <td className="px-6 py-4 text-slate-600">
                                {hr.email}
                              </td>
                              <td className="px-6 py-4 capitalize text-slate-600">
                                {hr.role}
                              </td>
                              <td className="px-6 py-4">
                                <span
                                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                                    hr.is_active
                                      ? "bg-emerald-50 text-emerald-700"
                                      : "bg-rose-50 text-rose-700"
                                  }`}
                                >
                                  {hr.is_active ? "Active" : "Inactive"}
                                </span>
                              </td>
                              <td>
                              <button
                                type="button"
                                onClick={() => setSelectedHR(hr)}
                                className="rounded-lg border border-blue-200 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50"
                              >
                                Reset Password
                              </button>
                            </td>
                              <td className="px-6 py-4 text-slate-600">
                                {formatDate(hr.created_at)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </section>
          )}

          {/* EMPLOYEE: MY PROFILE */}
          {role === "employee" && activeNav === "My Profile" && (
            <section className="rounded-2xl border border-slate-200 bg-white p-6">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    Personal Information
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    View and update your personal details.
                  </p>
                </div>

                {!editingProfile && myProfile && (
                  <button
                    type="button"
                    onClick={() => {
                      setProfileError("");
                      setEditingProfile(true);
                    }}
                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                  >
                    Edit Profile
                  </button>
                )}
              </div>

              {profileLoading ? (
                <p className="mt-4 text-slate-500">Loading your profile...</p>
              ) : profileError && !myProfile ? (
                <p className="mt-4 text-sm text-red-600">{profileError}</p>
              ) : myProfile ? (
                <>
                  {editingProfile ? (
                    <form
                      onSubmit={handleUpdateMyProfile}
                      className="mt-6 max-w-xl space-y-5"
                    >
                      <div>
                        <label
                          htmlFor="profile-full-name"
                          className="mb-1 block text-sm font-medium text-slate-700"
                        >
                          Full Name
                        </label>
                        <input
                          id="profile-full-name"
                          name="full_name"
                          type="text"
                          required
                          defaultValue={myProfile.full_name || ""}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="profile-phone"
                          className="mb-1 block text-sm font-medium text-slate-700"
                        >
                          Phone
                        </label>
                        <input
                          id="profile-phone"
                          name="phone"
                          type="tel"
                          required
                          defaultValue={myProfile.phone || ""}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                        />
                      </div>

                      {profileError && (
                        <p className="text-sm text-red-600">{profileError}</p>
                      )}

                      <div className="flex flex-wrap gap-3">
                        <button
                          type="submit"
                          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                        >
                          Save Changes
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setProfileError("");
                            setEditingProfile(false);
                          }}
                          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="mt-6 grid gap-5 sm:grid-cols-2">
                      <div>
                        <p className="text-sm text-slate-500">Full Name</p>
                        <p className="mt-1 font-medium text-slate-900">
                          {myProfile.full_name || "—"}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-slate-500">Email</p>
                        <p className="mt-1 font-medium text-slate-900">
                          {myProfile.email || "—"}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-slate-500">Phone</p>
                        <p className="mt-1 font-medium text-slate-900">
                          {myProfile.phone || "—"}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-slate-500">Department</p>
                        <p className="mt-1 font-medium text-slate-900">
                          {myProfile.department || "—"}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-slate-500">Job Title</p>
                        <p className="mt-1 font-medium text-slate-900">
                          {myProfile.job_title || "—"}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-slate-500">Joining Date</p>
                        <p className="mt-1 font-medium text-slate-900">
                          {myProfile.joining_date
                            ? formatDate(myProfile.joining_date)
                            : "—"}
                        </p>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <p className="mt-4 text-slate-500">
                  No profile information found.
                </p>
              )}
            </section>
          )}

          {/* Unknown role fallback */}
          {!canManageEmployees && role !== "employee" && (
            <section className="rounded-xl border border-slate-200 bg-white p-6">
              <p className="text-slate-600">
                This dashboard role does not have a configured view.
              </p>
            </section>
          )}

          {/* Add HR modal */}
          {role === "admin" && hrModalOpen && (
            <AddHRModal
              // hr={selectedHR}
              onClose={() => setHrModalOpen(false)}
              onAdd={handleCreateHR}
              isSubmitting={creatingHR}
            />
          )}
          {/* Reset HR Password modal */}
          {role === "admin" && selectedHR && (
            <ResetHRPasswordModal
              hr={selectedHR}
              onClose={() => setSelectedHR(null)}
              onReset={handleResetHRPassword}
              isSubmitting={resettingHR}
            />
          )}

          {/* Add/Edit Employee modal */}
          {canManageEmployees && modalOpen && (
            <AddEmployeeModal
              onClose={handleCloseModal}
              onAdd={handleAddEmployee}
              onUpdate={handleUpdateEmployee}
              employee={selectedEmployee}
              isSubmitting={addingEmployee || updatingEmployee}
            />
          )}

          {/* Delete Employee modal */}
          {canManageEmployees && employeeToDelete && (
            <DeleteEmployeeModal
              employee={employeeToDelete}
              onClose={handleCloseDeleteModal}
              onConfirm={handleConfirmDelete}
              isDeleting={deletingEmployee}
            />
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
