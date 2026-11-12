import {
  getBookingDateOnly,
  getBookingId,
  getBookingSpotId,
  getSpotId,
} from '../../utils/bookingValidation';

function formatSpot(spot) {
  if (!spot) {
    return 'Spot no longer available';
  }

  const number = spot.spotNumber ? `Spot ${spot.spotNumber}` : `Spot ${getSpotId(spot)}`;
  const details = [spot.zone, spot.spotSize].filter(Boolean).join(' · ');
  return details ? `${number} — ${details}` : number;
}

function StarterMessage({ children }) {
  return <p className="bookings-message">{children}</p>;
}

export default function BookingHistoryTable({
  bookings,
  spots,
  loading,
  submitting,
  deletingBookingId,
  onEdit,
  onDeleteBooking,
}) {
  return (
    <>
      <style>{`
        .booking-table-wrap { overflow-x: auto; }
        .booking-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }
        .booking-table th, .booking-table td {
          padding: 13px 12px;
          border-bottom: 1px solid #e8eee9;
          vertical-align: middle;
        }
        .booking-table th {
          color: var(--booking-muted);
          font-size: 12px;
          font-weight: 700;
          letter-spacing: .06em;
          text-transform: uppercase;
          white-space: nowrap;
        }
        .booking-table td { color: var(--booking-ink); }
        .booking-spot-name { font-weight: 650; }
        .booking-spot-details {
          display: block;
          color: var(--booking-muted);
          font-size: 13px;
        }
        .booking-actions { white-space: nowrap; }
        @media (max-width: 760px) {
          .booking-table { min-width: 760px; }
        }
      `}</style>

      <section className="booking-panel" aria-labelledby="booking-history-heading">
        <h2 id="booking-history-heading">Booking history</h2>
        {loading ? (
          <StarterMessage>Loading booking history…</StarterMessage>
        ) : bookings.length === 0 ? (
          <StarterMessage>You don’t have any bookings yet.</StarterMessage>
        ) : (
          <div className="booking-table-wrap">
            <table className="booking-table">
              <thead>
                <tr>
                  <th scope="col">Booking ID</th>
                  <th scope="col">Spot info</th>
                  <th scope="col">Booking Date</th>
                  <th scope="col">Product Type</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => {
                  const bookingId = getBookingId(booking);
                  const spotId = getBookingSpotId(booking);
                  const spot = spots.find((availableSpot) => getSpotId(availableSpot) === spotId)
                    || booking.spot
                    || null;

                  return (
                    <tr key={bookingId}>
                      <td>{bookingId || '—'}</td>
                      <td>
                        <span className="booking-spot-name">{formatSpot(spot)}</span>
                        {spot?.locationDescription && (
                          <span className="booking-spot-details">{spot.locationDescription}</span>
                        )}
                      </td>
                      <td>{getBookingDateOnly(booking.bookingDate) || '—'}</td>
                      <td>{booking.productType || '—'}</td>
                      <td className="booking-actions">
                        <button
                          className="booking-button booking-button-text"
                          type="button"
                          onClick={() => onEdit(booking)}
                          disabled={submitting || Boolean(deletingBookingId)}
                        >
                          Edit
                        </button>
                        <button
                          className="booking-button booking-button-text booking-button-danger"
                          type="button"
                          onClick={() => onDeleteBooking(booking)}
                          disabled={deletingBookingId === bookingId || submitting}
                        >
                          {deletingBookingId === bookingId ? 'Deleting…' : 'Delete'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
