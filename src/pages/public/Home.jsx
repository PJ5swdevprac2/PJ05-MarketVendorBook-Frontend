import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import SpotCard from "../../components/SpotCard";
import { useAuth } from "../../contexts/useAuth";
import { getAllSpots } from "../../api/spotApi";

export default function Home() {
  const [spots, setSpots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedZone, setSelectedZone] = useState("ALL");
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryFromUrl = searchParams.get("q") || "";
  const activeSearchQuery = searchParams.has("q") ? queryFromUrl : searchQuery;

  useEffect(() => {
    let active = true;
    getAllSpots()
      .then((data) => {
        if (active) setSpots(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        if (active) setError(err.response?.data?.error || "Unable to load spots right now.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const zones = useMemo(
    () => [...new Set(spots.map((spot) => spot.zone).filter((zone) => typeof zone === "string" && zone))].sort(),
    [spots],
  );
  const filteredSpots = useMemo(() => {
    const query = activeSearchQuery.toLowerCase().trim();
    return spots.filter((spot) => (
      String(spot.spotNumber ?? "").toLowerCase().includes(query)
      && (selectedZone === "ALL" || spot.zone === selectedZone)
    ));
  }, [spots, activeSearchQuery, selectedZone]);

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedZone("ALL");
    setSearchParams({}, { replace: true });
  };

  const handleBook = (spot) => {
    const spotId = spot._id ?? spot.id;
    if (!user) return navigate("/login", { state: { from: "/my-bookings" } });
    navigate("/my-bookings", { state: { spotId } });
  };

  return (
    <>
      <section className="bg-neutral-600 px-4 py-16 text-center text-white">
        <h1
          className="mx-auto w-full max-w-xl text-center text-3xl font-semibold leading-tight sm:text-4xl"
          style={{ color: "#fff", textAlign: "center", margin: "0 auto" }}
        >
          Book your night market spot in minutes
        </h1>
        <p className="mt-4 text-sm text-gray-200">Choose an available spot, review details, and reserve instantly.</p>
        <div className="mt-6 flex justify-center gap-3">
          <a href="#zones" className="inline-flex h-11 items-center rounded-md border border-white/70 px-6 text-sm font-medium hover:bg-white/10">View Zones</a>
          {!user && (
            <Link to="/login" className="inline-flex h-11 items-center rounded-md bg-black px-6 text-sm font-medium text-white hover:bg-gray-900">Login/Register</Link>
          )}
        </div>
      </section>

      <section id="spots" className="mx-auto max-w-6xl px-4 pt-14 text-center">
        <h2 className="text-3xl font-semibold text-black">Available Vendor Spots</h2>
        <p className="mt-2 text-sm text-slate-500">Showing spots currently open for booking.</p>
      </section>

      <section id="how" className="mx-auto mt-10 grid max-w-5xl gap-6 px-4 md:grid-cols-2">
        {[
          ["How booking works", "Fast & clear", "Browse spots by zone, check size and rental fee, then tap “Book Now” to reserve.", ["Instant Reservation", "Transparent Fees"]],
          ["Need help?", "Support at hand", "Questions about setup, timings, or requirements? Contact our team before booking.", ["Vendor Support", "Setup Guidance"]],
        ].map(([title, sub, body, tags]) => (
          <div key={title} className="flex gap-4 rounded-lg border border-gray-200 bg-white p-4">
            <div className="h-16 w-16 shrink-0 rounded bg-gray-100" aria-hidden />
            <div>
              <h3 className="font-medium text-black">{title}</h3>
              <p className="text-xs text-slate-400">{sub}</p>
              <p className="mt-1 text-sm text-black">{body}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {tags.map((t) => <span key={t} className="rounded bg-gray-100 px-2 py-0.5 text-[11px] text-slate-600">{t}</span>)}
              </div>
            </div>
          </div>
        ))}
      </section>

      <section id="zones" className="mx-auto max-w-6xl px-4 py-14">
        <div className="mb-8 grid gap-4 rounded-xl border border-gray-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(180px,0.7fr)_auto] lg:items-end">
          <label className="block text-sm font-medium text-slate-700">
            Search by spot number
            <input
              type="search"
              value={activeSearchQuery}
              onChange={(event) => {
                setSearchQuery(event.target.value);
                if (searchParams.has("q")) setSearchParams({}, { replace: true });
              }}
              placeholder="e.g. A1"
              className="mt-1 h-10 w-full rounded-md border border-gray-300 px-3 font-normal text-black focus:border-black focus:outline-none focus:ring-2 focus:ring-black/10"
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Zone
            <select
              value={selectedZone}
              onChange={(event) => setSelectedZone(event.target.value)}
              className="mt-1 h-10 w-full rounded-md border border-gray-300 bg-white px-3 font-normal text-black focus:border-black focus:outline-none focus:ring-2 focus:ring-black/10"
            >
              <option value="ALL">All zones</option>
              {zones.map((zone) => <option key={zone} value={zone}>{zone}</option>)}
            </select>
          </label>

          <button
            type="button"
            onClick={resetFilters}
            className="h-10 rounded-md border border-gray-300 px-4 text-sm font-medium text-slate-700 hover:bg-gray-50"
          >
            Reset Filter
          </button>
        </div>

        {loading ? (
          <p className="text-center text-slate-500">Loading available spots…</p>
        ) : error ? (
          <p className="text-center text-red-600">{error}</p>
        ) : spots.length === 0 ? (
          <p className="text-center text-slate-500">No spots are open for booking right now. Check back soon.</p>
        ) : filteredSpots.length === 0 ? (
          <p className="text-center text-slate-500">No spots match your filter</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredSpots.map((s, i) => <SpotCard key={s._id ?? s.id} spot={s} index={i} onBook={handleBook} />)}
          </div>
        )}
      </section>

      <footer className="border-t border-gray-100 px-4 py-10 text-sm text-black">
        <div className="mx-auto flex max-w-6xl flex-wrap justify-between gap-4">
          <span>© Night Market Vendor Spot Booking</span>
          <span>Privacy Policy • Terms of Service</span>
          <span>For vendor support: support@nightmarket.example</span>
        </div>
      </footer>
    </>
  );
}