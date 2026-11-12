import { Link, useNavigate } from "react-router-dom";
import SpotCard from "../../components/SpotCard";
import { useAuth } from "../../contexts/useAuth";
// import { getAllSpots } from "../../api/spotApi"; // switch on when Dev 2's spotApi is ready

// Mock data (same shape as API: zone, spotSize, locationDescription, rentalFee)
const MOCK_SPOTS = [
  ["Riverside", "3m × 3m", "Near main walkway", 45], ["Riverside", "3m × 4m", "By riverside lights", 55],
  ["Riverside", "4m × 4m", "Corner view of entrance", 75], ["Food Street", "3m × 3m", "Next to seating area", 50],
  ["Food Street", "3m × 4m", "Mid-row, high foot traffic", 60], ["Food Street", "4m × 4m", "Close to stage sound zone", 80],
  ["Arts Lane", "3m × 3m", "Near mural wall", 40], ["Arts Lane", "3m × 4m", "Alley-facing storefronts", 52],
  ["Arts Lane", "4m × 4m", "Corner opposite craft booths", 70], ["Central Park", "3m × 3m", "Near event games area", 48],
  ["Central Park", "3m × 4m", "Adjacent to restrooms", 58], ["Central Park", "4m × 4m", "Main crossing lane", 78],
].map(([zone, spotSize, locationDescription, rentalFee], i) => ({
  _id: `mock-${i + 1}`, zone, spotSize, locationDescription, rentalFee,
}));

export default function Home() {
  const spots = MOCK_SPOTS;
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleBook = (spot) => {
    if (!user) return navigate("/login", { state: { from: "/my-bookings" } });
    navigate("/my-bookings", { state: { spotId: spot._id } });
  };

  return (
    <>
      <section className="bg-neutral-600 px-4 py-16 text-center text-white">
        <h1 className="mx-auto max-w-xl text-3xl font-semibold leading-tight sm:text-4xl">
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
        {spots.length === 0 ? (
          <p className="text-center text-slate-500">No spots are open for booking right now. Check back soon.</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {spots.map((s, i) => <SpotCard key={s._id} spot={s} index={i} onBook={handleBook} />)}
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