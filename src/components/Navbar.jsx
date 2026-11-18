import { useState } from "react";
import { Link, NavLink, useNavigate, useSearchParams } from "react-router-dom";
import { logoutUser } from "../api/authApi";
import { useAuth } from "../contexts/useAuth";

export default function Navbar() {
  const { user, clearSession } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [logoutError, setLogoutError] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);
  const roleLabel = user?.role === "admin" ? "Admin" : "User";
  const displayName = user?.name
    ? (user.name.length > 5 ? `${user.name.slice(0, 5)}..` : user.name)
    : "";

  const submitSearch = (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const query = String(formData.get("query") || "").trim();
    navigate({ pathname: "/", search: `?q=${encodeURIComponent(query)}` });
  };

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
      <div className="mx-auto flex h-16 min-w-0 max-w-7xl items-center justify-between gap-3 px-4">
        <Link to="/" className="flex min-w-0 flex-1 items-center gap-2 xl:gap-3">
          <span className="h-9 w-9 rounded-full bg-gray-200" aria-hidden />
          <span className="hidden min-w-0 truncate whitespace-nowrap text-sm font-semibold leading-tight tracking-tight text-black sm:inline md:text-base xl:text-lg">
            Night Market Vendor Spot Booking
          </span>
        </Link>

        <div className="flex shrink-0 items-center gap-2 whitespace-nowrap xl:gap-3">
          <form onSubmit={submitSearch} role="search" className="hidden shrink-0 md:block">
            <input
              key={searchParams.get("q") || ""}
              type="search"
              name="query"
              aria-label="Search spots by number"
              placeholder="Search in site"
              defaultValue={searchParams.get("q") || ""}
              className="h-9 w-36 rounded-md border border-gray-200 px-3 text-sm placeholder:text-gray-400 focus:border-black focus:outline-none lg:w-44"
            />
          </form>
          {user ? (
            <>
              <NavLink
                to={user.role === "admin" ? "/admin/spots" : "/my-bookings"}
                className="shrink-0 text-sm font-medium text-black hover:underline"
              >
                {user.role === "admin" ? "Admin" : "My Bookings"}
              </NavLink>
              <span
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                  user.role === "admin"
                    ? "bg-violet-100 text-violet-800"
                    : "bg-slate-100 text-slate-700"
                }`}
                aria-label={`Current role: ${roleLabel}`}
              >
                {roleLabel}
              </span>
              <span className="hidden shrink-0 text-sm text-slate-500 xl:inline" title={user.name}>{displayName}</span>
              <button
                type="button"
                onClick={logout}
                disabled={loggingOut}
                className="h-10 shrink-0 whitespace-nowrap rounded-md border border-gray-300 bg-white px-3 text-sm font-medium text-black hover:bg-gray-50 disabled:cursor-wait disabled:opacity-60 xl:px-4 xl:text-base"
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