import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AuthCard, Field, PrimaryButton } from "../../components/AuthCard";
import { useAuth } from "../../contexts/useAuth";
import { loginUser } from "../../api/authApi";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function PasswordField({ value, onChange, error, visible, onToggle }) {
  return (
    <label className="mb-4 block">
      <span className="text-sm font-medium text-black">Password</span>
      <span className="relative mt-1 block">
        <input
          id="login-password"
          name="password"
          type={visible ? "text" : "password"}
          placeholder="Enter your password"
          value={value}
          onChange={onChange}
          autoComplete="current-password"
          aria-invalid={!!error}
          aria-describedby={error ? "login-password-error" : undefined}
          className={`h-10 w-full rounded-md border px-3 pr-11 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 ${
            error ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:border-black focus:ring-black"
          }`}
        />
        <button
          type="button"
          onClick={onToggle}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5"
          >
            {visible ? (
              <>
                <path d="M2.2 12s3.3-7 9.8-7 9.8 7 9.8 7-3.3 7-9.8 7-9.8-7-9.8-7z" />
                <circle cx="12" cy="12" r="3" />
              </>
            ) : (
              <>
                <path d="M3 3l18 18" />
                <path d="M10.6 10.6a2 2 0 002.8 2.8" />
                <path d="M9.9 5.2A10.7 10.7 0 0112 5c6.5 0 9.8 7 9.8 7a15.7 15.7 0 01-3 3.8" />
                <path d="M6.2 6.2A16.3 16.3 0 002.2 12s3.3 7 9.8 7a10.5 10.5 0 004.1-.8" />
              </>
            )}
          </svg>
        </button>
      </span>
      {error && <span id="login-password-error" className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  );
}

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { saveSession } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const validate = () => {
    const e = {};
    if (!form.email.trim()) e.email = "Email is required.";
    else if (!EMAIL_RE.test(form.email)) e.email = "Enter a valid email, e.g. name@example.com.";
    if (!form.password) e.password = "Password is required.";
    return e;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return; // never reach the backend with bad data
    setBusy(true);
    setServerError("");
    try {
      const res = await loginUser(form);
      const payload = res.data ?? res;
      const { token, ...user } = payload;
      saveSession(token, user);
      navigate(location.state?.from ?? (user.role === "admin" ? "/admin/spots" : "/"), { replace: true });
    } catch (err) {
      setServerError(err.response?.data?.error || err.response?.data?.message || "Email or password is incorrect.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthCard title="Welcome back" subtitle="Log in to book and manage your night market spots.">
      <form onSubmit={submit} noValidate>
        {serverError && <p role="alert" className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{serverError}</p>}
        <Field label="Email" type="email" placeholder="e.g., name@example.com" value={form.email} onChange={set("email")} error={errors.email} autoComplete="email" />
        <PasswordField
          value={form.password}
          onChange={set("password")}
          error={errors.password}
          visible={showPassword}
          onToggle={() => setShowPassword((visible) => !visible)}
        />
        <PrimaryButton type="submit" disabled={busy}>{busy ? "Logging in…" : "Log in"}</PrimaryButton>
      </form>
      <p className="mt-5 text-center text-sm text-slate-500">
        New vendor? <Link to="/register" className="font-medium text-black underline">Create an account</Link>
      </p>
    </AuthCard>
  );
}