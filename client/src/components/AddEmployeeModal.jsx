
import { useEffect, useState } from "react";
import { X, UserPlus, Pencil } from "lucide-react";
import { employeeSchema } from "../schemas/employee.schema";

const emptyForm = {
  name: "",
  email: "",
  department: "Engineering",
  role: "",
  password: "",
};

const departmentOptions = [
  "Engineering",
  "Human Resources",
  "Design",
  "Marketing",
  "Finance",
  "Operations",
];

export default function AddEmployeeModal({
  onClose,
  onAdd,
  onUpdate,
  employee,
  isSubmitting = false,
}) {
  const [form, setForm] = useState({ ...emptyForm });
  const [error, setError] = useState("");

  const isEditing = Boolean(employee?.id);

  // Edit mode mein existing employee ki details fill hongi.
  // Add mode mein form blank rahega.
  useEffect(() => {
    if (employee) {
      setForm({
        name: employee.name || employee.full_name || "",
        email: employee.email || "",
        department: employee.department || "Engineering",
        role: employee.role || employee.job_title || "",
        password: "",
      });
    } else {
      setForm({ ...emptyForm });
    }

    setError("");
  }, [employee]);

  // Form fields ki values update karna.
  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
  }

  // Form submit karna.
  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    // Password sirf naye employee ke liye required hai.
    if (!isEditing && form.password.length < 12) {
      setError("Password must be at least 12 characters long.");
      return;
    }

    // Existing employee schema se fields validate karna.
    const employeeData = {
      name: form.name.trim(),
      email: form.email.trim(),
      department: form.department,
      role: form.role.trim(),
    };

    const result = employeeSchema.safeParse(employeeData);

    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }

    const validatedData = {
      ...result.data,
      email: result.data.email.toLowerCase(),
    };

    try {
      if (isEditing) {
        if (!onUpdate) {
          throw new Error("Employee update function is not available.");
        }

        await onUpdate(employee.id, validatedData);
      } else {
        if (!onAdd) {
          throw new Error("Employee create function is not available.");
        }

        await onAdd({
          ...validatedData,
          password: form.password,
        });
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          `Employee ${isEditing ? "update" : "create"} nahi ho paaya. Please try again.`
      );
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isSubmitting) {
          onClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="employee-modal-title"
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              {isEditing ? (
                <Pencil size={21} />
              ) : (
                <UserPlus size={21} />
              )}
            </div>

            <div>
              <h2
                id="employee-modal-title"
                className="text-lg font-semibold text-slate-900"
              >
                {isEditing ? "Edit Employee" : "Add New Employee"}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {isEditing
                  ? "Update employee information"
                  : "Create a new employee account"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close modal"
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        {/* Employee Form */}
        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          {/* Full Name */}
          <div>
            <label
              htmlFor="employee-name"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Full Name
            </label>

            <input
              id="employee-name"
              name="name"
              type="text"
              value={form.name}
              onChange={handleChange}
              placeholder="Enter full name"
              autoComplete="name"
              required
              disabled={isSubmitting}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-50"
            />
          </div>

          {/* Work Email */}
          <div>
            <label
              htmlFor="employee-email"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Work Email
            </label>

            <input
              id="employee-email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="name@company.com"
              autoComplete="email"
              required
              disabled={isSubmitting || isEditing}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-50"
            />

            {isEditing && (
              <p className="mt-1 text-xs text-slate-500">
                Email cannot be changed here.
              </p>
            )}
          </div>

          {/* Password: only for a new employee */}
          {!isEditing && (
            <div>
              <label
                htmlFor="employee-password"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Login Password
              </label>

              <input
                id="employee-password"
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                minLength={12}
                autoComplete="new-password"
                required
                disabled={isSubmitting}
                placeholder="Minimum 12 characters"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-50"
              />

              <p className="mt-1 text-xs text-slate-500">
                Employee will use this password to log in.
              </p>
            </div>
          )}

          {/* Department and Job Title */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label
                htmlFor="employee-department"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Department
              </label>

              <select
                id="employee-department"
                name="department"
                value={form.department}
                onChange={handleChange}
                required
                disabled={isSubmitting}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-50"
              >
                {departmentOptions.map((department) => (
                  <option key={department} value={department}>
                    {department}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="employee-role"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Job Title
              </label>

              <input
                id="employee-role"
                name="role"
                type="text"
                value={form.role}
                onChange={handleChange}
                placeholder="e.g. Software Engineer"
                required
                disabled={isSubmitting}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-50"
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          {/* Footer Buttons */}
          <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting
                ? "Please wait..."
                : isEditing
                  ? "Save Changes"
                  : "Create Employee"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
