function getBookingId(booking) {
  const id = booking._id ?? booking.id;
  return id == null ? '' : String(id);
}

function getDateOnly(value) {
  return typeof value === 'string' ? value.slice(0, 10) : '—';
}

export default function AdminBookingTable({
  bookings,
  loading,
  submitting,
  deletingBookingId,
  onEdit,
  onDelete,
}) {
  return (
    <>
      <style>{`
        .admin-booking-table-wrap {
          overflow-x: auto;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          background: #fff;
        }
        .admin-booking-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }
        .admin-booking-table th, .admin-booking-table td {
          padding: 12px 14px;
          border-bottom: 1px solid #e2e8f0;
          vertical-align: middle;
        }
        .admin-booking-table th {
          background: #f8fafc;
          color: #334155;
          font-size: 11px;
          font-weight: 650;
          white-space: nowrap;
        }
        .admin-booking-table td {
          color: #475569;
          font-size: 12px;
        }
        .admin-booking-table tbody tr:last-child td { border-bottom: 0; }
        .admin-booking-table tbody tr:hover { background: #fbfdff; }
        .admin-booking-id {
          max-width: 150px;
          color: #0f172a !important;
          font-weight: 650;
          overflow-wrap: anywhere;
        }
        .admin-booking-member-name {
          display: block;
          color: #0f172a;
          font-weight: 600;
        }
        .admin-booking-member-email {
          display: block;
          margin-top: 2px;
          color: #64748b;
          font-size: 11px;
        }
        .admin-booking-actions {
          display: flex;
          gap: 7px;
          white-space: nowrap;
        }
        .admin-booking-action {
          min-height: 30px;
          padding: 4px 10px;
          border: 1px solid #dbe2ea;
          border-radius: 5px;
          background: #f8fafc;
          color: #334155;
          cursor: pointer;
          font: inherit;
          font-size: 11px;
          font-weight: 600;
        }
        .admin-booking-action:hover { background: #eef2f6; }
        .admin-booking-action:disabled { cursor: wait; opacity: .6; }
        .admin-booking-delete {
          border-color: #fecaca;
          background: #fff7f7;
          color: #b42318;
        }
        .admin-booking-delete:hover { background: #fff1f2; }
        .admin-booking-empty {
          padding: 28px 14px !important;
          color: #64748b !important;
          text-align: center;
        }
        @media (max-width: 850px) {
          .admin-booking-table { min-width: 790px; }
        }
      `}</style>

      <div className="admin-booking-table-wrap">
        <table className="admin-booking-table">
          <thead>
            <tr>
              <th scope="col">Booking ID</th>
              <th scope="col">Member</th>
              <th scope="col">Spot</th>
              <th scope="col">Booking Date</th>
              <th scope="col">Product Type</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="admin-booking-empty" colSpan="6">Loading bookings…</td>
              </tr>
            ) : bookings.length === 0 ? (
              <tr>
                <td className="admin-booking-empty" colSpan="6">
                  No bookings found.
                </td>
              </tr>
            ) : (
              bookings.map((booking) => {
                const bookingId = getBookingId(booking);
                const user = booking.user;
                const spot = booking.spot;
                return (
                  <tr key={bookingId}>
                    <td className="admin-booking-id">{bookingId || '—'}</td>
                    <td>
                      <span className="admin-booking-member-name">
                        {user?.name || 'Unknown member'}
                      </span>
                      <span className="admin-booking-member-email">
                        {user?.email || '—'}
                      </span>
                    </td>
                    <td>
                      {spot
                        ? `${spot.spotNumber || '—'}${spot.zone ? ` - ${spot.zone}` : ''}`
                        : 'Deleted spot'}
                    </td>
                    <td>{getDateOnly(booking.bookingDate)}</td>
                    <td>{booking.productType || '—'}</td>
                    <td>
                      <div className="admin-booking-actions">
                        <button
                          className="admin-booking-action"
                          type="button"
                          onClick={() => onEdit(booking)}
                          disabled={submitting || Boolean(deletingBookingId)}
                        >
                          Edit
                        </button>
                        <button
                          className="admin-booking-action admin-booking-delete"
                          type="button"
                          onClick={() => onDelete(booking)}
                          disabled={deletingBookingId === bookingId || submitting}
                        >
                          {deletingBookingId === bookingId ? 'Deleting…' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
