const ICONS = ["🌙", "🏮", "🛍️", "🍢", "🥟", "🍜", "🎶", "🖌️", "🧃", "🎯", "🏮", "🌟"];

export default function SpotCard({ spot, index = 0, onBook }) {
  return (
    <article className="flex flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-3xl" aria-hidden>
        {ICONS[index % ICONS.length]}
      </div>
      <h3 className="mt-3 text-center text-base font-medium text-black">
        Spot #{spot.spotNumber ?? String(index + 1).padStart(2, "0")}
      </h3>
      <p className="text-center text-xs text-slate-400">Zone: {spot.zone}</p>

      <div className="mt-4 flex-1 space-y-2 text-sm text-black">
        <p>Size: {spot.spotSize}</p>
        <p>Location: {spot.locationDescription}</p>
        <p className="font-bold">Rental Fee: RM {spot.rentalFee}/night</p>
      </div>

      <button
        onClick={() => onBook(spot)}
        className="mt-4 h-10 w-full rounded-md bg-black text-sm font-medium text-white hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
      >
        Book Now
      </button>
    </article>
  );
}