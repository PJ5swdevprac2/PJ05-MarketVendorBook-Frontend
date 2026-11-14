import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { logoutUser } from "../api/authApi";
import { useAuth } from "../contexts/useAuth";

const links = [
  { label: "Spots", href: "/#spots" },
  { label: "Zones", href: "/#zones" },
  { label: "Pricing", href: "/#spots" },
  { label: "How It Works", href: "/#how" },
];

export default function Navbar() {
  const { user, clearSession } = useAuth();
  const navigate = useNavigate();
  const [logoutError, setLogoutError] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);
  const roleLabel = user?.role === "admin" ? "Admin account" : "User account";

  const logout = async () => {
    setLogoutError("");
    setLoggingOut(true);
    try {
      await logoutUser();
    } catch {
      setLogoutError("You’re signed out on this device, but we couldn’t confirm logout with the server. Close the browser if this is a shared device.");
    } finally {
      clearSession();
      navigate("/");
      setLoggingOut(false);
    }
  };

  return (
    <>
    <header className="sticky top-0 z-30 border-b border-gray-100 bg-white shadow-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link to="/" className="flex items-center gap-3">
          <span className="h-9 w-9 rounded-full bg-gray-200" aria-hidden />
          <span className="text-lg font-medium text-black sm:text-xl">Night Market Vendor Spot Booking</span>
        </Link>

        <nav className="hidden items-center gap-7 text-sm text-black lg:flex">
          {links.map((l) => (
            <a key={l.label} href={l.href} className="hover:underline">{l.label}</a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <input
            type="search"
            placeholder="Search in site"
            className="hidden h-9 w-44 rounded-md border border-gray-200 px-3 text-sm placeholder:text-gray-400 focus:border-black focus:outline-none md:block"
          />
          {user ? (
            <>
              <NavLink
                to={user.role === "admin" ? "/admin/spots" : "/my-bookings"}
                className="text-sm font-medium text-black hover:underline"
              >
                {user.role === "admin" ? "Admin" : "My Bookings"}
              </NavLink>
              <span
                className={`rounded-full px-2 py-1 text-[11px] font-semibold ${
                  user.role === "admin"
                    ? "bg-violet-100 text-violet-800"
                    : "bg-slate-100 text-slate-700"
                }`}
                aria-label={`Current role: ${roleLabel}`}
              >
                {roleLabel}
              </span>
              <span className="hidden text-sm text-slate-500 sm:inline">{user.name}</span>
              <button
                type="button"
                onClick={logout}
                disabled={loggingOut}
                className="h-10 shrink-0 whitespace-nowrap rounded-md border border-gray-300 bg-white px-4 text-base font-medium text-black hover:bg-gray-50 disabled:cursor-wait disabled:opacity-60"
              >
                {loggingOut ? "Logging out…" : "Log out"}
              </button>
            </>
          ) : (
            <Link to="/login" className="inline-flex h-9 items-center rounded-md bg-black px-4 text-sm font-medium text-white hover:bg-gray-800">
              Login/Register
            </Link>
          )}
        </div>
      </div>
    </header>
    {logoutError && (
      <p className="mx-auto max-w-6xl px-4 py-2 text-sm text-red-700" role="alert">
        {logoutError}
      </p>
    )}
    </>
  );
}