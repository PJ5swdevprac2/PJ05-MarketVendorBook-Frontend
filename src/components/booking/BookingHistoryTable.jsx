import {
  getBookingDateOnly,
  getBookingId,
  getBookingSpotId,
  getSpotId,
} from '../../utils/bookingValidation';

function StarterMessage({ children }) {
  return <p className="bookings-message">{children}</p>;
}

export default function BookingHistoryTable({
  historySectionRef,
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
        .booking-history-panel { padding-top: 26px; scroll-margin-top: 5rem; }
        .booking-history-heading { margin-bottom: 17px; }
        .booking-history-heading h2 {
          margin: 0 0 8px;
          color: var(--booking-ink);
          font-size: clamp(24px, 3vw, 29px);
          font-weight: 750;
          letter-spacing: -.025em;
        }
        .booking-history-heading p {
          color: #334155;
          font-size: 14px;
        }
        .booking-table-wrap {
          overflow-x: auto;
          border: 1px solid var(--booking-border);
          border-radius: 8px;
          background: #fff;
        }
        .booking-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }
        .booking-table th, .booking-table td {
          padding: 13px 15px;
          border-bottom: 1px solid #e2e8f0;
          vertical-align: middle;
        }
        .booking-table th {
          background: #f8fafc;
          color: #334155;
          font-size: 12px;
          font-weight: 600;
          white-space: nowrap;
        }
        .booking-table td {
          color: #475569;
          font-size: 13px;
        }
        .booking-table tbody tr:last-child td { border-bottom: 0; }
        .booking-table tbody tr:hover { background: #fbfdff; }
        .booking-id-cell {
          color: #0f172a !important;
          font-weight: 650;
          white-space: nowrap;
        }
        .booking-actions {
          display: flex;
          flex-wrap: nowrap;
          gap: 8px;
          white-space: nowrap;
        }
        .booking-history-action {
          min-height: 31px;
          padding: 4px 11px;
          border: 1px solid #cbd5e1;
          border-radius: 5px;
          background: #fff;
          color: #1e293b;
          cursor: pointer;
          font: inherit;
          font-size: 12px;
        }
        .booking-history-action:disabled { cursor: wait; opacity: .6; }
        .booking-history-cancel {
          border-color: #fecaca;
          background: #fff7f7;
          color: #b42318;
        }
        @media (max-width: 700px) {
          .booking-table { min-width: 680px; }
          .booking-table th, .booking-table td { padding: 11px 12px; }
        }
      `}</style>

      <section
        className="booking-history-panel"
        ref={historySectionRef}
        aria-labelledby="booking-history-heading"
      >
        <div className="booking-history-heading">
          <h2 id="booking-history-heading">Booking History</h2>
          <p>Table view of your past and upcoming bookings.</p>
        </div>

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
                  <th scope="col">Spot Number</th>
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
                      <td className="booking-id-cell">{bookingId || '—'}</td>
                      <td>{spot?.spotNumber || '—'}</td>
                      <td>{getBookingDateOnly(booking.bookingDate) || '—'}</td>
                      <td>{booking.productType || '—'}</td>
                      <td>
                        <div className="booking-actions">
                          <button
                            className="booking-history-action"
                            type="button"
                            onClick={() => onEdit(booking)}
                            disabled={submitting || Boolean(deletingBookingId)}
                          >
                            Edit
                          </button>
                          <button
                            className="booking-history-action booking-history-cancel"
                            type="button"
                            onClick={() => onDeleteBooking(booking)}
                            disabled={deletingBookingId === bookingId || submitting}
                          >
                            {deletingBookingId === bookingId ? 'Cancelling…' : 'Cancel'}
                          </button>
                        </div>
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
