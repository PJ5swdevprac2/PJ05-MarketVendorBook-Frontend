import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AuthCard, Field, PrimaryButton } from "../../components/AuthCard";
import { useAuth } from "../../contexts/useAuth";
import { loginUser } from "../../api/authApi";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [busy, setBusy] = useState(false);
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
        <Field label="Password" type="password" placeholder="Enter your password" value={form.password} onChange={set("password")} error={errors.password} autoComplete="current-password" />
        <PrimaryButton type="submit" disabled={busy}>{busy ? "Logging in…" : "Log in"}</PrimaryButton>
      </form>
      <p className="mt-5 text-center text-sm text-slate-500">
        New vendor? <Link to="/register" className="font-medium text-black underline">Create an account</Link>
      </p>
    </AuthCard>
  );
}