import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthCard, Field, PrimaryButton } from "../../components/AuthCard";
import { registerUser } from "../../api/authApi";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Register() {
  const [form, setForm] = useState({ name: "", email: "", tel: "", password: "", confirm: "" });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

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
      await registerUser({ name, email, tel, password, role: "member" });
      navigate("/login", { state: { registered: true } });
    } catch (err) {
      setServerError(err.response?.data?.message || "Could not create your account. Try again.");
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
        <Field label="Password" type="password" placeholder="At least 6 characters" value={form.password} onChange={set("password")} error={errors.password} autoComplete="new-password" />
        <Field label="Confirm password" type="password" placeholder="Re-enter your password" value={form.confirm} onChange={set("confirm")} error={errors.confirm} autoComplete="new-password" />
        <PrimaryButton type="submit" disabled={busy}>{busy ? "Creating account…" : "Create account"}</PrimaryButton>
      </form>
      <p className="mt-5 text-center text-sm text-slate-500">
        Already registered? <Link to="/login" className="font-medium text-black underline">Log in</Link>
      </p>
    </AuthCard>
  );
}