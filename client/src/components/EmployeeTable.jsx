
import { useMemo, useState } from "react";
import {
  Search,
  Plus,
  Download,
  SlidersHorizontal,
  MoreHorizontal,
  Mail,
  Users,
  Pencil,
  Trash2,
} from "lucide-react";

const departmentOptions = [
  "All Departments",
  "Engineering",
  "Human Resources",
  "Design",
  "Marketing",
  "Finance",
  "Operations",
];

const statusStyles = {
  Active: "bg-emerald-50 text-emerald-700",
  "On Leave": "bg-amber-50 text-amber-700",
  Inactive: "bg-slate-100 text-slate-600",
};

export default function EmployeeTable({
  employees,
  onAddClick,
  onEditClick,
  onDelete,
  search,
  onSearchChange,
  department,
  onDepartmentChange,
  totalEmployees,
  loading,
}) {
  const [openMenuId, setOpenMenuId] = useState(null);
  // Department options available in the currently loaded records.
  const departments = useMemo(() => {
  const availableDepartments = employees
    .map((employee) => employee.department)
    .filter(
      (item) =>
        typeof item === "string" && item.trim() !== "",
    );

  return [
    ...new Set([
      ...departmentOptions,
      ...availableDepartments,
      ...(department && department !== "All Departments"
        ? [department]
        : []),
    ]),
  ];
}, [employees, department]);

  function exportCSV() {
    const headers = [
      "Name",
      "Email",
      "Department",
      "Job Title",
      "Status",
      "Date Joined",
    ];

    const escapeCSV = (value) =>
      `"${String(value ?? "").replace(/"/g, '""')}"`;

    const rows = employees.map((employee) => [
      employee.name,
      employee.email,
      employee.department,
      employee.role,
      employee.status,
      employee.joined,
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map(escapeCSV).join(","))
      .join("\r\n");

    const url = URL.createObjectURL(
      new Blob(["\uFEFF" + csv], {
        type: "text/csv;charset=utf-8;",
      }),
    );

    const link = document.createElement("a");
    link.href = url;
    link.download = "employees.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-slate-900">
              Employee Directory
            </h3>

            <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
              {totalEmployees ?? employees.length}
            </span>
          </div>

          <p className="mt-1 text-sm text-slate-500">
            View and manage your team members.
          </p>
        </div>       
      </div>

      <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:px-6">
        <label className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 focus-within:border-indigo-500">
          <Search size={18} className="shrink-0 text-slate-400" />

          <input
            type="search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search by name or email..."
            aria-label="Search employees"
            className="w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-slate-400"
          />
        </label>

        <div className="flex flex-wrap gap-2">
          <label className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5">
            <SlidersHorizontal
              size={16}
              className="text-slate-400"
            />

            <select
              value={department}
              onChange={(event) =>
                onDepartmentChange(event.target.value)
              }
              aria-label="Filter by department"
              className="max-w-48 bg-transparent text-sm text-slate-700 outline-none"
            >
              {departments.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            onClick={exportCSV}
            disabled={employees.length === 0}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download size={16} />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left">
          <thead className="bg-slate-50/80">
            <tr>
              {[
                "Employee",
                "Department",
                "Job Title",
                "Status",
                "Joined",
                "",
              ].map((heading, index) => (
                <th
                  key={heading || `actions-${index}`}
                  className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500"
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {employees.map((employee) => (
              <tr
                key={employee.id}
                className="transition hover:bg-slate-50/70"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${employee.color}`}
                    >
                      {employee.initials}
                    </div>

                    <div>
                      <p className="whitespace-nowrap text-sm font-semibold text-slate-800">
                        {employee.name}
                      </p>

                      <p className="mt-1 flex items-center gap-1.5 whitespace-nowrap text-xs text-slate-500">
                        <Mail size={12} />
                        {employee.email}
                      </p>
                    </div>
                  </div>
                </td>

                <td className="px-6 py-4 text-sm text-slate-600">
                  {employee.department || "—"}
                </td>

                <td className="px-6 py-4 text-sm text-slate-600">
                  {employee.role}
                </td>

                <td className="px-6 py-4">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                      statusStyles[employee.status] ||
                      statusStyles.Inactive
                    }`}
                  >
                    {employee.status}
                  </span>
                </td>

                <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500">
                  {employee.joined}
                </td>

                <td className="px-6 py-4">
                 
                  <div className="relative flex justify-end">
                    <button
                      type="button"
                      aria-label={`Actions for ${employee.name}`}
                      aria-expanded={openMenuId === employee.id}
                      onClick={() =>
                        setOpenMenuId((currentId) =>
                          currentId === employee.id ? null : employee.id
                        )
                      }
                      className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                    >
                      <MoreHorizontal size={19} />
                    </button>

                    {openMenuId === employee.id && (
                      <div className="absolute right-8 top-0 z-20 w-40 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg">
                        <button
                          type="button"
                          onClick={() => {
                            setOpenMenuId(null);
                            onEditClick(employee);
                          }}
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                        >
                          <Pencil size={15} />
                          Edit Employee
                        </button>                        
                        <button
                          type="button"
                          onClick={() => {
                            setOpenMenuId(null);
                            onDelete(employee);
                          }}
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                        >
                          <Trash2 size={15} />
                          Delete Employee
                        </button>

                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {!loading && employees.length === 0 && (
          <div className="px-6 py-14 text-center">
            <Users
              className="mx-auto text-slate-300"
              size={32}
            />

            <p className="mt-3 font-semibold text-slate-800">
              No employees found
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Try a different search or department.
            </p>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2 border-t border-slate-100 px-6 py-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <p>
          Showing {employees.length} employees on this page
        </p>

        <p>Live employee data · Backend integration</p>
      </div>
    </section>
  );
}
