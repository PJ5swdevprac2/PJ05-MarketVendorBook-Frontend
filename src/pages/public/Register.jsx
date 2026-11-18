import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthCard, Field, PrimaryButton } from "../../components/AuthCard";
import { registerUser } from "../../api/authApi";
import { useAuth } from "../../contexts/useAuth";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function PasswordField({ id, label, value, onChange, error, visible, onToggle, autoComplete }) {
  const errorId = `${id}-error`;

  return (
    <label className="mb-4 block">
      <span className="text-sm font-medium text-black">{label}</span>
      <span className="relative mt-1 block">
        <input
          id={id}
          name={id}
          type={visible ? "text" : "password"}
          placeholder={id === "password" ? "At least 6 characters" : "Re-enter your password"}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
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
      {error && <span id={errorId} className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  );
}

function getPasswordStrength(password) {
  if (!password) return null;

  const hasLowercase = /[a-z]/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasNumberOrSymbol = /[\d\W_]/.test(password);

  if (password.length >= 8 && hasLowercase && hasUppercase && hasNumberOrSymbol) {
    return { label: "Strong", width: "100%", color: "bg-green-500", textColor: "text-green-700" };
  }
  if (password.length >= 6 && (hasNumber || hasUppercase)) {
    return { label: "Medium", width: "66%", color: "bg-amber-500", textColor: "text-amber-700" };
  }
  return { label: "Weak", width: "33%", color: "bg-red-500", textColor: "text-red-700" };
}

export default function Register() {
  const [form, setForm] = useState({ name: "", email: "", tel: "", password: "", confirm: "" });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();
  const { saveSession } = useAuth();
  const passwordStrength = getPasswordStrength(form.password);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Name is required.";
    if (!form.email.trim()) e.email = "Email is required.";
    else if (!EMAIL_RE.test(form.email)) e.email = "Enter a valid email, e.g. name@example.com.";
    if (!form.tel.trim()) e.tel = "Phone number is required.";
    else if (!/^[0-9+\-\s]{8,15}$/.test(form.tel)) e.tel = "Enter 8–15 digits.";
    if (!form.password) e.password = "Password is required.";
    else if (form.password.length < 6) e.password = "Use at least 6 characters.";
    if (form.confirm !== form.password) e.confirm = "Passwords do not match.";
    return e;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;
    setBusy(true);
    setServerError("");
    try {
      const { name, email, tel, password } = form;
      const response = await registerUser({ name, email, tel, password, role: "member" });
      const account = response?.data;
      if (!account?.token || !account?.id || !account?.role) {
        setServerError("Your account was created, but automatic sign in failed. Please log in.");
        return;
      }
      const { token, ...user } = account;
      saveSession(token, user);
      navigate(user.role === "admin" ? "/admin/spots" : "/my-bookings", { replace: true });
    } catch (err) {
      setServerError(err.response?.data?.error || err.response?.data?.message || "Could not create your account. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthCard title="Create your account" subtitle="Register as a vendor to start booking spots.">
      <form onSubmit={submit} noValidate>
        {serverError && <p role="alert" className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{serverError}</p>}
        <Field label="Full name" placeholder="e.g., Somchai Prasert" value={form.name} onChange={set("name")} error={errors.name} autoComplete="name" />
        <Field label="Email" type="email" placeholder="e.g., name@example.com" value={form.email} onChange={set("email")} error={errors.email} autoComplete="email" />
        <Field label="Phone" type="tel" placeholder="e.g., 0812345678" value={form.tel} onChange={set("tel")} error={errors.tel} autoComplete="tel" />
        <PasswordField
          id="password"
          label="Password"
          value={form.password}
          onChange={set("password")}
          error={errors.password}
          visible={showPassword}
          onToggle={() => setShowPassword((visible) => !visible)}
          autoComplete="new-password"
        />
        {passwordStrength && (
          <div className="-mt-3 mb-4" aria-live="polite">
            <div
              className="h-2 overflow-hidden rounded-full bg-gray-200"
              role="progressbar"
              aria-label="Password strength"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={passwordStrength.label === "Strong" ? 100 : passwordStrength.label === "Medium" ? 66 : 33}
            >
              <div
                className={`h-full rounded-full transition-all duration-200 ${passwordStrength.color}`}
                style={{ width: passwordStrength.width }}
              />
            </div>
            <p className={`mt-1 text-xs font-medium ${passwordStrength.textColor}`}>
              {passwordStrength.label} password
            </p>
          </div>
        )}
        <PasswordField
          id="confirm"
          label="Confirm password"
          value={form.confirm}
          onChange={set("confirm")}
          error={errors.confirm}
          visible={showConfirmPassword}
          onToggle={() => setShowConfirmPassword((visible) => !visible)}
          autoComplete="new-password"
        />
        <PrimaryButton type="submit" disabled={busy}>{busy ? "Creating account…" : "Create account"}</PrimaryButton>
      </form>
      <p className="mt-5 text-center text-sm text-slate-500">
        Already registered? <Link to="/login" className="font-medium text-black underline">Log in</Link>
      </p>
    </AuthCard>
  );
}