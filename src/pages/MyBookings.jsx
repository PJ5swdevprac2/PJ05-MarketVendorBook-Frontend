import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  createBooking,
  deleteBooking,
  getMyBookings,
  updateBooking,
} from '../api/bookingApi';
import { getAllSpots } from '../api/spotApi';

const productTypes = [
  'Food & Produce',
  'Handmade Crafts',
  'Personal Goods',
  'Clothing & Textiles',
  'Other',
];

function getTodayDate() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getDateOnly(value) {
  return typeof value === 'string' ? value.slice(0, 10) : '';
}

function normalizeId(value) {
  if (value && typeof value === 'object') {
    value = value.id ?? value._id ?? value.spotId;
  }
  return value == null ? '' : String(value);
}

function getSpotId(spot) {
  return normalizeId(spot.id ?? spot._id ?? spot.spotId);
}

function getBookingSpotId(booking) {
  return normalizeId(booking.spotId ?? booking.spot?.id ?? booking.spot?._id ?? booking.spot);
}

function getBookingId(booking) {
  return normalizeId(booking.id ?? booking._id ?? booking.bookingId);
}

function getErrorMessage(error) {
  return error?.response?.data?.message
    || error?.message
    || 'Something went wrong. Please try again.';
}

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

export default function MyBookings() {
  const location = useLocation();
  const querySpotId = new URLSearchParams(location.search).get('spotId');
  const preselectedSpotId = querySpotId || location.state?.spotId;
  const today = getTodayDate();

  const [spots, setSpots] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [formData, setFormData] = useState({
    spotId: preselectedSpotId == null ? '' : String(preselectedSpotId),
    bookingDate: '',
    productType: '',
  });
  const [editingBookingId, setEditingBookingId] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingBookingId, setDeletingBookingId] = useState('');

  useEffect(() => {
    let active = true;

    async function loadPageData() {
      setLoading(true);
      setErrorMessage('');

      try {
        const [availableSpots, userBookings] = await Promise.all([
          getAllSpots(),
          getMyBookings(),
        ]);

        if (!Array.isArray(availableSpots) || !Array.isArray(userBookings)) {
          throw new Error('The server returned booking data in an unexpected format.');
        }

        if (active) {
          setSpots(availableSpots);
          setBookings(userBookings);
        }
      } catch (error) {
        if (active) {
          setErrorMessage(getErrorMessage(error));
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadPageData();
    return () => {
      active = false;
    };
  }, []);

  async function refreshBookings() {
    const updatedBookings = await getMyBookings();
    if (!Array.isArray(updatedBookings)) {
      throw new Error('The server returned booking data in an unexpected format.');
    }
    setBookings(updatedBookings);
  }

  function validateBooking() {
    if (!formData.spotId || !spots.some((spot) => getSpotId(spot) === formData.spotId)) {
      return 'Please select an available spot.';
    }
    if (!formData.bookingDate) {
      return 'Please select a booking date.';
    }
    if (formData.bookingDate < today) {
      return 'Booking date cannot be in the past.';
    }
    if (!formData.productType) {
      return 'Please select a product type.';
    }

    const otherBookingsForDate = bookings.filter((booking) => (
      getBookingId(booking) !== editingBookingId
      && getDateOnly(booking.bookingDate) === formData.bookingDate
    ));

    if (otherBookingsForDate.length >= 3) {
      return 'You can book a maximum of 3 spots per day.';
    }
    if (otherBookingsForDate.some((booking) => getBookingSpotId(booking) === formData.spotId)) {
      return 'You already have a booking for this spot on that date.';
    }

    return '';
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setErrorMessage('');

    const validationMessage = validateBooking();
    if (validationMessage) {
      setErrorMessage(validationMessage);
      return;
    }

    const bookingData = {
      spotId: formData.spotId,
      bookingDate: formData.bookingDate,
      productType: formData.productType,
    };

    setSubmitting(true);
    try {
      if (editingBookingId) {
        await updateBooking(editingBookingId, bookingData);
      } else {
        await createBooking(bookingData);
      }

      await refreshBookings();
      setEditingBookingId('');
      setFormData({
        spotId: preselectedSpotId == null ? '' : String(preselectedSpotId),
        bookingDate: '',
        productType: '',
      });
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  function handleEdit(booking) {
    setErrorMessage('');
    setEditingBookingId(getBookingId(booking));
    setFormData({
      spotId: getBookingSpotId(booking),
      bookingDate: getDateOnly(booking.bookingDate),
      productType: booking.productType || '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleCancelEdit() {
    setEditingBookingId('');
    setErrorMessage('');
    setFormData({
      spotId: preselectedSpotId == null ? '' : String(preselectedSpotId),
      bookingDate: '',
      productType: '',
    });
  }

  async function handleDelete(booking) {
    if (!window.confirm('Are you sure you want to cancel this booking?')) {
      return;
    }

    const bookingId = getBookingId(booking);
    setErrorMessage('');
    setDeletingBookingId(bookingId);
    try {
      await deleteBooking(bookingId);
      await refreshBookings();
      if (editingBookingId === bookingId) {
        handleCancelEdit();
      }
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setDeletingBookingId('');
    }
  }

  return (
    <main className="my-bookings-page">
      <style>{`
        .my-bookings-page {
          --booking-ink: #17211b;
          --booking-muted: #65736a;
          --booking-green: #246b45;
          --booking-border: #dce5dd;
          width: min(1120px, 100%);
          margin: 0 auto;
          padding: 48px 28px 64px;
          box-sizing: border-box;
          color: var(--booking-ink);
          text-align: left;
          font: 16px/1.5 system-ui, 'Segoe UI', sans-serif;
        }
        .my-bookings-page * { box-sizing: border-box; }
        .bookings-header { margin-bottom: 28px; }
        .bookings-eyebrow {
          color: var(--booking-green);
          font-size: 13px;
          font-weight: 700;
          letter-spacing: .12em;
          text-transform: uppercase;
        }
        .bookings-header h1 {
          margin: 6px 0 4px;
          color: var(--booking-ink);
          font-size: clamp(30px, 5vw, 42px);
          letter-spacing: -.04em;
          line-height: 1.15;
        }
        .bookings-header p, .bookings-muted { color: var(--booking-muted); }
        .booking-panel {
          margin: 24px 0;
          padding: 24px;
          border: 1px solid var(--booking-border);
          border-radius: 14px;
          background: #fff;
          box-shadow: 0 8px 24px rgba(25, 54, 35, .05);
        }
        .booking-panel h2 {
          margin: 0 0 18px;
          color: var(--booking-ink);
          font-size: 21px;
          font-weight: 700;
        }
        .booking-form-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
        }
        .booking-field label {
          display: block;
          margin-bottom: 6px;
          color: var(--booking-ink);
          font-size: 14px;
          font-weight: 650;
        }
        .booking-field select, .booking-field input {
          width: 100%;
          min-height: 44px;
          padding: 9px 11px;
          border: 1px solid #cbd7cd;
          border-radius: 8px;
          background: #fff;
          color: var(--booking-ink);
          font: inherit;
        }
        .booking-field select:focus, .booking-field input:focus {
          border-color: var(--booking-green);
          outline: 3px solid rgba(36, 107, 69, .14);
        }
        .booking-form-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 20px;
        }
        .booking-button {
          min-height: 40px;
          padding: 8px 15px;
          border: 1px solid transparent;
          border-radius: 8px;
          cursor: pointer;
          font: inherit;
          font-weight: 650;
        }
        .booking-button:disabled { cursor: wait; opacity: .6; }
        .booking-button-primary { background: var(--booking-green); color: #fff; }
        .booking-button-secondary {
          border-color: var(--booking-border);
          background: #fff;
          color: var(--booking-ink);
        }
        .booking-button-text {
          min-height: auto;
          padding: 5px 8px;
          background: transparent;
          color: var(--booking-green);
        }
        .booking-button-danger { color: #a32e2e; }
        .booking-error {
          margin: 0 0 18px;
          padding: 12px 15px;
          border: 1px solid #f1b6b6;
          border-radius: 8px;
          background: #fff0f0;
          color: #8e2020;
          font-weight: 600;
        }
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
        .booking-status {
          display: inline-block;
          padding: 3px 9px;
          border-radius: 999px;
          background: #edf2ee;
          color: #47574c;
          font-size: 12px;
          font-weight: 700;
          text-transform: capitalize;
        }
        .booking-status-confirmed, .booking-status-approved {
          background: #e6f4ea;
          color: #23633c;
        }
        .booking-status-pending { background: #fff4d8; color: #815d08; }
        .booking-status-cancelled, .booking-status-rejected {
          background: #fdeaea;
          color: #9a3030;
        }
        .booking-actions { white-space: nowrap; }
        .bookings-message { padding: 22px 12px; color: var(--booking-muted); text-align: center; }
        @media (max-width: 760px) {
          .my-bookings-page { padding: 30px 16px 48px; }
          .booking-panel { padding: 18px 14px; }
          .booking-form-grid { grid-template-columns: 1fr; gap: 12px; }
          .booking-table { min-width: 760px; }
        }
      `}</style>

      <header className="bookings-header">
        <span className="bookings-eyebrow">Vendor account</span>
        <h1>My Bookings</h1>
        <p>Book a market spot and keep track of your upcoming dates.</p>
      </header>

      {errorMessage && (
        <div className="booking-error" role="alert">
          {errorMessage}
        </div>
      )}

      <section className="booking-panel" aria-labelledby="booking-form-heading">
        <h2 id="booking-form-heading">
          {editingBookingId ? 'Update booking' : 'Create a booking'}
        </h2>
        {loading ? (
          <StarterMessage>Loading spots and bookings…</StarterMessage>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="booking-form-grid">
              <div className="booking-field">
                <label htmlFor="booking-spot">Spot</label>
                <select
                  id="booking-spot"
                  required
                  value={formData.spotId}
                  onChange={(event) => setFormData({ ...formData, spotId: event.target.value })}
                >
                  <option value="">Select a spot</option>
                  {formData.spotId && !spots.some((spot) => getSpotId(spot) === formData.spotId) && (
                    <option value={formData.spotId} disabled>
                      Spot {formData.spotId} is unavailable
                    </option>
                  )}
                  {spots.map((spot) => (
                    <option key={getSpotId(spot)} value={getSpotId(spot)}>
                      {formatSpot(spot)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="booking-field">
                <label htmlFor="booking-date">Booking Date</label>
                <input
                  id="booking-date"
                  type="date"
                  min={today}
                  required
                  value={formData.bookingDate}
                  onChange={(event) => setFormData({ ...formData, bookingDate: event.target.value })}
                />
              </div>
              <div className="booking-field">
                <label htmlFor="booking-product-type">Product Type</label>
                <select
                  id="booking-product-type"
                  required
                  value={formData.productType}
                  onChange={(event) => setFormData({ ...formData, productType: event.target.value })}
                >
                  <option value="">Select a product type</option>
                  {productTypes.map((productType) => (
                    <option key={productType} value={productType}>{productType}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="booking-form-actions">
              <button className="booking-button booking-button-primary" type="submit" disabled={submitting}>
                {submitting ? 'Saving…' : editingBookingId ? 'Update booking' : 'Create booking'}
              </button>
              {editingBookingId && (
                <button
                  className="booking-button booking-button-secondary"
                  type="button"
                  onClick={handleCancelEdit}
                  disabled={submitting}
                >
                  Stop editing
                </button>
              )}
            </div>
          </form>
        )}
      </section>

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
                  <th scope="col">Status</th>
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
                  const status = String(booking.status || 'pending');
                  const statusClass = status.toLowerCase().replace(/[^a-z0-9-]/g, '-');

                  return (
                    <tr key={bookingId}>
                      <td>{bookingId || '—'}</td>
                      <td>
                        <span className="booking-spot-name">{formatSpot(spot)}</span>
                        {spot?.locationDescription && (
                          <span className="booking-spot-details">{spot.locationDescription}</span>
                        )}
                      </td>
                      <td>{getDateOnly(booking.bookingDate) || '—'}</td>
                      <td>{booking.productType || '—'}</td>
                      <td>
                        <span className={`booking-status booking-status-${statusClass}`}>
                          {status}
                        </span>
                      </td>
                      <td className="booking-actions">
                        <button
                          className="booking-button booking-button-text"
                          type="button"
                          onClick={() => handleEdit(booking)}
                          disabled={submitting || Boolean(deletingBookingId)}
                        >
                          Edit
                        </button>
                        <button
                          className="booking-button booking-button-text booking-button-danger"
                          type="button"
                          onClick={() => handleDelete(booking)}
                          disabled={deletingBookingId === bookingId || submitting}
                        >
                          {deletingBookingId === bookingId ? 'Cancelling…' : 'Cancel'}
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
    </main>
  );
}
