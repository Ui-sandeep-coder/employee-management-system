
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { loginSchema } from "../schemas/login.schema";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    // Purana error clear karo
    setError("");

    // Step 1: Zod se form validate karo
    const result = loginSchema.safeParse({
      email,
      password,
    });

    // Validation fail hui to API call nahi hogi
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }

    // Step 2: Validated data use karo
    const validatedData = {
      email: result.data.email.toLowerCase(),
      password: result.data.password,
    };

    setLoading(true);

    try {
      // Step 3: Backend login API call
      const response = await api.post("/auth/login", validatedData);

      const token = response.data.token;

      if (!token) {
        throw new Error("Login response mein token nahi mila.");
      }

      // Step 4: Token save karo
      sessionStorage.setItem("token", token);

      // Step 5: Dashboard par redirect
      navigate("/dashboard");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Login failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-indigo-600">
            PeopleFlow
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Employee Management System
          </p>
        </div>

        <h2 className="text-xl font-bold text-slate-900">
          Welcome back
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Sign in to access your dashboard.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Email address
            </label>

            <input
              id="email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Enter your email"
              className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Password
            </label>

            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-lg bg-red-50 p-3 text-sm text-red-600"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-indigo-600 px-4 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </main>
  );
}
