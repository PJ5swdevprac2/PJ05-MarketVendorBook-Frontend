import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  createBooking,
  deleteBooking,
  getMyBookings,
  updateBooking,
} from '../api/bookingApi';
import { getAllSpots } from '../api/spotApi';
import DashboardLayout from '../components/layout/DashboardLayout';
import {
  getBookingDateOnly,
  getBookingId,
  getBookingSpotId,
  getSpotId,
  validateBooking,
} from '../utils/bookingValidation';

// ─── helpers ────────────────────────────────────────────────────────────────

function getTodayDate() {
  // toLocaleDateString('en-CA') → YYYY-MM-DD in local time (no UTC offset bugs).
  return new Date().toLocaleDateString('en-CA');
}

function getErrorMessage(error) {
  return error?.response?.data?.error
    || error?.message
    || 'Something went wrong. Please try again.';
}

/** Map a validation/API error string to the form field it belongs to. */
function classifyError(msg) {
  if (!msg) return { field: null, text: '' };
  if (
    msg === 'Please select an available spot.' ||
    msg === 'You already have a booking for this spot on that date.'
  ) return { field: 'spot', text: msg };
  if (
    msg === 'Please select a booking date.' ||
    msg === 'Booking date cannot be in the past.' ||
    msg === 'You can book a maximum of 3 spots per day.'
  ) return { field: 'date', text: msg };
  if (msg === 'Please select a product type.') return { field: 'productType', text: msg };
  return { field: 'general', text: msg };
}

const PRODUCT_TYPE_PRESETS = [
  'Fresh Produce',
  'Handmade Crafts',
  'Prepared Foods',
  'Clothing & Accessories',
  'Other',
];

function formatSpot(spot) {
  const number = spot.spotNumber ? `Spot ${spot.spotNumber}` : `Spot ${getSpotId(spot)}`;
  const details = [spot.zone, spot.spotSize].filter(Boolean).join(' · ');
  return details ? `${number} — ${details}` : number;
}

// ─── component ──────────────────────────────────────────────────────────────

export default function MyBookings() {
  const location = useLocation();
  const querySpotId = new URLSearchParams(location.search).get('spotId');
  const preselectedSpotId = querySpotId || location.state?.spotId;
  const today = getTodayDate();

  const [spots, setSpots] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [formData, setFormData] = useState({
    spot: preselectedSpotId == null ? '' : String(preselectedSpotId),
    bookingDate: '',
    productType: '',
  });
  const [editingBookingId, setEditingBookingId] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingBookingId, setDeletingBookingId] = useState('');
  const [activeTab, setActiveTab] = useState('upcoming');
  const formSectionRef = useRef(null);
  const bookingHistoryRef = useRef(null);

  // Derive the per-field error (or general error) from the single errorMessage string.
  const { field: errorField, text: errorText } = classifyError(errorMessage);

  // Partition bookings into upcoming / past using local-date comparison.
  const todayStr = getTodayDate();
  const upcomingBookings = bookings
    .filter((b) => (b.bookingDate?.slice(0, 10) ?? '') >= todayStr)
    .sort((a, b) =>
      (a.bookingDate?.slice(0, 10) ?? '').localeCompare(b.bookingDate?.slice(0, 10) ?? '')
    );
  const pastBookings = bookings
    .filter((b) => (b.bookingDate?.slice(0, 10) ?? '') < todayStr)
    .sort((a, b) =>
      (b.bookingDate?.slice(0, 10) ?? '').localeCompare(a.bookingDate?.slice(0, 10) ?? '')
    );
  const displayedBookings = activeTab === 'upcoming' ? upcomingBookings : pastBookings;

  // ── data loading ──────────────────────────────────────────────────────────

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
        if (active) setErrorMessage(getErrorMessage(error));
      } finally {
        if (active) setLoading(false);
      }
    }

    loadPageData();
    return () => { active = false; };
  }, []);

  async function refreshBookings() {
    const updatedBookings = await getMyBookings();
    if (!Array.isArray(updatedBookings)) {
      throw new Error('The server returned booking data in an unexpected format.');
    }
    setBookings(updatedBookings);
  }

  // ── form handlers ─────────────────────────────────────────────────────────

  function handleFormChange(event) {
    const { name, value } = event.currentTarget;
    // Auto-clear any stale error when the user changes a field.
    setErrorMessage('');
    setFormData((current) => ({ ...current, [name]: value }));
  }

  function handleProductTypeSelect(productType) {
    // Auto-clear stale error when the user picks a preset.
    setErrorMessage('');
    setFormData((current) => ({ ...current, productType }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setErrorMessage('');

    const validationMessage = validateBooking({
      ...formData,
      spots,
      bookings,
      editingBookingId,
      today,
    });
    if (validationMessage) {
      setErrorMessage(validationMessage);
      return;
    }

    const bookingData = {
      spot: formData.spot,
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
        spot: preselectedSpotId == null ? '' : String(preselectedSpotId),
        bookingDate: '',
        productType: '',
      });
      requestAnimationFrame(() => {
        bookingHistoryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
      spot: getBookingSpotId(booking),
      bookingDate: getBookingDateOnly(booking.bookingDate),
      productType: booking.productType || '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleCancelEdit() {
    setEditingBookingId('');
    setErrorMessage('');
    setFormData({
      spot: preselectedSpotId == null ? '' : String(preselectedSpotId),
      bookingDate: '',
      productType: '',
    });
  }

  function handleNewBooking() {
    handleCancelEdit();
    formSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const spotSelector = formSectionRef.current?.querySelector('#booking-spot');
    if (spotSelector) {
      spotSelector.focus({ preventScroll: true });
    } else {
      formSectionRef.current?.focus({ preventScroll: true });
    }
  }

  async function handleDelete(booking) {
    if (!window.confirm('Permanently delete this booking?')) return;

    const bookingId = getBookingId(booking);
    setErrorMessage('');
    setDeletingBookingId(bookingId);
    try {
      await deleteBooking(bookingId);
      await refreshBookings();
      if (editingBookingId === bookingId) handleCancelEdit();
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setDeletingBookingId('');
    }
  }

  function handleRebook(booking) {
    setEditingBookingId('');
    setErrorMessage('');
    setFormData({
      spot: booking.spot?._id || booking.spotId || (typeof booking.spot === 'string' ? booking.spot : ''),
      bookingDate: '',
      productType: booking.productType || '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <DashboardLayout>
      <main className="my-bookings-page">
        <style>{`
          /* ── Page shell ─────────────────────────────────────── */
          .my-bookings-page {
            --booking-ink: #0f172a;
            --booking-muted: #64748b;
            --booking-border: #e2e8f0;
            --booking-black: #050505;
            width: min(1120px, 100%);
            margin: 0 auto;
            padding: 38px 36px 64px;
            box-sizing: border-box;
            color: var(--booking-ink);
            font: 15px/1.5 Inter, ui-sans-serif, system-ui, 'Segoe UI', sans-serif;
          }

          /* ── Header ─────────────────────────────────────────── */
          .bookings-header {
            padding: 4px 0 34px;
            text-align: center;
          }
          .bookings-header h1 {
            margin: 0 0 9px;
            color: var(--booking-ink);
            font-size: clamp(30px, 4vw, 38px);
            font-weight: 750;
            letter-spacing: -.035em;
            line-height: 1.15;
          }
          .bookings-header p { color: #334155; font-size: 14px; }
          .bookings-action-row {
            display: flex;
            justify-content: center;
            margin-top: 20px;
          }

          /* ── Shared button base ──────────────────────────────── */
          .booking-button {
            min-height: 42px;
            padding: 9px 22px;
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            cursor: pointer;
            font: inherit;
            font-size: 14px;
            font-weight: 600;
          }
          .booking-button:disabled { cursor: wait; opacity: .6; }
          .booking-button-primary {
            border-color: var(--booking-black);
            background: var(--booking-black);
            color: #fff;
          }
          .booking-button-secondary { background: #fff; color: var(--booking-ink); }
          .booking-button-text {
            min-height: 32px;
            padding: 5px 11px;
            background: #fff;
            color: var(--booking-ink);
            font-size: 13px;
          }
          .booking-button-danger {
            border-color: #fecaca;
            background: #fff7f7;
            color: #b42318;
          }
          .bookings-message {
            padding: 28px 12px;
            color: var(--booking-muted);
            text-align: center;
          }

          /* ── Booking form panel ──────────────────────────────── */
          .booking-form-panel {
            display: grid;
            grid-template-columns: repeat(12, minmax(0, 1fr));
            align-items: center;
            gap: 36px;
            padding: 48px 0;
            border-block: 1px solid var(--booking-border);
          }
          .booking-form-intro { grid-column: span 5; }
          .booking-form-intro h2 {
            margin: 0 0 13px;
            color: var(--booking-ink);
            font-size: clamp(24px, 3vw, 30px);
            font-weight: 750;
            letter-spacing: -.025em;
            line-height: 1.2;
          }
          .booking-form-intro p {
            max-width: 410px;
            color: #334155;
            font-size: 14px;
          }
          .booking-form-content { grid-column: span 7; min-width: 0; }
          .booking-fields { display: grid; gap: 15px; }
          .booking-field label {
            display: block;
            margin-bottom: 6px;
            color: var(--booking-ink);
            font-size: 13px;
            font-weight: 650;
          }
          .booking-field select, .booking-field input {
            width: 100%;
            min-height: 42px;
            padding: 9px 11px;
            border: 1px solid #cbd5e1;
            border-radius: 6px;
            background: #fff;
            color: var(--booking-ink);
            font: inherit;
            font-size: 14px;
          }
          .booking-field select:focus, .booking-field input:focus {
            border-color: #64748b;
            outline: 3px solid rgba(15, 23, 42, .1);
          }
          .booking-field-error select, .booking-field-error input {
            border-color: #f87171;
          }
          /* Muted hint (neutral gray) */
          .booking-date-help {
            display: block;
            margin-top: 4px;
            color: #6b7280;
            font-size: 12px;
            font-style: normal;
          }
          /* Inline field-level error (red) */
          .booking-field-msg {
            display: block;
            margin-top: 4px;
            color: #dc2626;
            font-size: 12px;
            font-weight: 500;
          }
          /* General error (above Save button, no banner) */
          .booking-general-error {
            margin-top: 14px;
            padding: 10px 13px;
            border-radius: 6px;
            background: #fff1f2;
            border: 1px solid #fecaca;
            color: #b42318;
            font-size: 13px;
            font-weight: 600;
          }
          .product-type-presets {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
            margin: 1px 0 8px;
          }
          .product-type-preset {
            min-height: 30px;
            padding: 4px 9px;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            background: #f8fafc;
            color: #1e293b;
            cursor: pointer;
            font: inherit;
            font-size: 12px;
            line-height: 1.2;
          }
          .product-type-preset:hover,
          .product-type-preset[aria-pressed='true'] {
            border-color: #111827;
            background: #f1f5f9;
          }
          .product-type-help {
            display: block;
            margin-top: 4px;
            color: #64748b;
            font-size: 12px;
          }
          .booking-form-actions {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            margin-top: 22px;
          }
          .booking-form-actions .booking-button { min-height: 44px; }

          /* ── Tab switcher ────────────────────────────────────── */
          .bookings-tabs {
            display: flex;
            gap: 4px;
            border-bottom: 2px solid var(--booking-border);
            margin-bottom: 20px;
          }
          .bookings-tab-btn {
            padding: 9px 20px;
            border: none;
            border-bottom: 3px solid transparent;
            border-radius: 0;
            background: transparent;
            color: var(--booking-muted);
            cursor: pointer;
            font: inherit;
            font-size: 14px;
            font-weight: 600;
            margin-bottom: -2px;
            transition: color .15s, border-color .15s;
          }
          .bookings-tab-btn:hover { color: var(--booking-ink); }
          .bookings-tab-btn[aria-selected="true"] {
            border-bottom-color: var(--booking-black);
            color: var(--booking-ink);
          }

          /* ── Booking history panel ───────────────────────────── */
          .booking-history-panel { padding-top: 26px; scroll-margin-top: 5rem; }
          .booking-history-heading { margin-bottom: 17px; }
          .booking-history-heading h2 {
            margin: 0 0 8px;
            color: var(--booking-ink);
            font-size: clamp(24px, 3vw, 29px);
            font-weight: 750;
            letter-spacing: -.025em;
          }
          .booking-history-heading p { color: #334155; font-size: 14px; }
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
          .booking-table td { color: #475569; font-size: 13px; }
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
          .booking-history-rebook {
            border-color: #bfdbfe;
            background: #eff6ff;
            color: #1d4ed8;
            font-weight: 600;
          }
          .booking-history-rebook:hover { background: #dbeafe; }

          /* ── Completed badge ─────────────────────────────────── */
          .booking-status-completed {
            display: inline-flex;
            align-items: center;
            gap: 5px;
            padding: 3px 10px;
            border-radius: 999px;
            background: #f0fdf4;
            color: #15803d;
            font-size: 11px;
            font-weight: 650;
            letter-spacing: .01em;
            white-space: nowrap;
          }

          /* ── Empty-state card ────────────────────────────────── */
          .bookings-empty-card {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 10px;
            padding: 48px 24px;
            border: 1px dashed #cbd5e1;
            border-radius: 10px;
            background: #f8fafc;
            text-align: center;
          }
          .bookings-empty-icon { font-size: 36px; line-height: 1; }
          .bookings-empty-title {
            margin: 0;
            font-size: 15px;
            font-weight: 650;
            color: var(--booking-ink);
          }
          .bookings-empty-sub { margin: 0; font-size: 13px; color: var(--booking-muted); }

          /* ── Responsive ──────────────────────────────────────── */
          @media (max-width: 800px) {
            .booking-form-panel {
              grid-template-columns: 1fr;
              gap: 24px;
              padding: 34px 0;
            }
            .booking-form-intro, .booking-form-content { grid-column: 1 / -1; }
          }
          @media (max-width: 760px) {
            .my-bookings-page { padding: 28px 18px 48px; }
            .bookings-header { padding-bottom: 26px; }
          }
          @media (max-width: 700px) {
            .booking-table { min-width: 680px; }
            .booking-table th, .booking-table td { padding: 11px 12px; }
          }
          @media (max-width: 480px) {
            .booking-form-actions { grid-template-columns: 1fr; }
          }
        `}</style>

        {/* ── Page header ── */}
        <header className="bookings-header">
          <h1>My Bookings</h1>
          <p>Review your booking history, update details, or cancel upcoming bookings.</p>
          <div className="bookings-action-row">
            <button
              className="booking-button booking-button-primary"
              type="button"
              onClick={handleNewBooking}
            >
              New Booking
            </button>
          </div>
        </header>

        {/* ── Booking form (inlined for full error-placement control) ── */}
        <section
          className="booking-form-panel"
          ref={formSectionRef}
          tabIndex={-1}
          aria-labelledby="booking-form-heading"
        >
          <div className="booking-form-intro">
            <h2 id="booking-form-heading">Create / Update Booking</h2>
            <p>Enter booking details. System will validate your date and spot limits.</p>
          </div>

          <div className="booking-form-content">
            {loading ? (
              <p className="bookings-message">Loading spots and bookings…</p>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="booking-fields">

                  {/* Select Spot */}
                  <div className={`booking-field${errorField === 'spot' ? ' booking-field-error' : ''}`}>
                    <label htmlFor="booking-spot">Select Spot</label>
                    <select
                      id="booking-spot"
                      name="spot"
                      required
                      value={formData.spot}
                      onChange={handleFormChange}
                    >
                      <option value="">Select a spot</option>
                      {formData.spot && !spots.some((s) => getSpotId(s) === formData.spot) && (
                        <option value={formData.spot} disabled>
                          Spot {formData.spot} is unavailable
                        </option>
                      )}
                      {spots.map((spot) => (
                        <option key={getSpotId(spot)} value={getSpotId(spot)}>
                          {formatSpot(spot)}
                        </option>
                      ))}
                    </select>
                    {errorField === 'spot' && (
                      <span className="booking-field-msg" role="alert">{errorText}</span>
                    )}
                  </div>

                  {/* Booking Date */}
                  <div className={`booking-field${errorField === 'date' ? ' booking-field-error' : ''}`}>
                    <label htmlFor="booking-date">Booking Date</label>
                    <input
                      id="booking-date"
                      name="bookingDate"
                      type="date"
                      min={today}
                      required
                      value={formData.bookingDate}
                      onChange={handleFormChange}
                    />
                    {errorField === 'date' ? (
                      <span className="booking-field-msg" role="alert">{errorText}</span>
                    ) : (
                      <span className="booking-date-help">
                        Select today or a future date (up to 3 spots per day).
                      </span>
                    )}
                  </div>

                  {/* Product Type */}
                  <div className={`booking-field${errorField === 'productType' ? ' booking-field-error' : ''}`}>
                    <label htmlFor="booking-product-type">Product Type</label>
                    <div className="product-type-presets" aria-label="Product type suggestions">
                      {PRODUCT_TYPE_PRESETS.map((preset) => (
                        <button
                          key={preset}
                          className="product-type-preset"
                          type="button"
                          aria-pressed={formData.productType === preset}
                          onClick={() => handleProductTypeSelect(preset)}
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                    <input
                      id="booking-product-type"
                      name="productType"
                      type="text"
                      required
                      placeholder="Enter a product type"
                      value={formData.productType}
                      onChange={handleFormChange}
                    />
                    {errorField === 'productType' && (
                      <span className="booking-field-msg" role="alert">{errorText}</span>
                    )}
                  </div>
                </div>

                {/* General / API error — shown above the Save button, no banner */}
                {errorField === 'general' && (
                  <div className="booking-general-error" role="alert">
                    {errorText}
                  </div>
                )}

                <div className="booking-form-actions">
                  <button
                    className="booking-button booking-button-secondary"
                    type="button"
                    onClick={handleCancelEdit}
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button
                    className="booking-button booking-button-primary"
                    type="submit"
                    disabled={submitting}
                  >
                    {submitting ? 'Saving…' : 'Save Booking'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </section>

        {/* ── Booking history panel ── */}
        <section
          className="booking-history-panel"
          ref={bookingHistoryRef}
          aria-labelledby="booking-history-heading"
        >
          <div className="booking-history-heading">
            <h2 id="booking-history-heading">Booking History</h2>
            <p>Table view of your past and upcoming bookings.</p>
          </div>

          {/* Tab switcher */}
          <div className="bookings-tabs" role="tablist" aria-label="Booking tabs">
            <button
              role="tab"
              aria-selected={activeTab === 'upcoming'}
              className="bookings-tab-btn"
              type="button"
              onClick={() => setActiveTab('upcoming')}
            >
              Upcoming ({upcomingBookings.length})
            </button>
            <button
              role="tab"
              aria-selected={activeTab === 'past'}
              className="bookings-tab-btn"
              type="button"
              onClick={() => setActiveTab('past')}
            >
              Past ({pastBookings.length})
            </button>
          </div>

          {loading ? (
            <p className="bookings-message">Loading booking history…</p>
          ) : displayedBookings.length === 0 ? (
            <div className="bookings-empty-card" role="status">
              <span className="bookings-empty-icon" aria-hidden="true">
                {activeTab === 'upcoming' ? '📅' : '🗂️'}
              </span>
              <p className="bookings-empty-title">
                {activeTab === 'upcoming' ? 'No upcoming bookings' : 'No past bookings'}
              </p>
              <p className="bookings-empty-sub">
                {activeTab === 'upcoming'
                  ? 'Use the form above to book your first spot.'
                  : 'Your completed bookings will appear here.'}
              </p>
            </div>
          ) : (
            <div className="booking-table-wrap">
              <table className="booking-table">
                <thead>
                  <tr>
                    <th scope="col">Booking ID</th>
                    <th scope="col">Spot Number</th>
                    <th scope="col">Booking Date</th>
                    <th scope="col">Product Type</th>
                    <th scope="col">{activeTab === 'past' ? 'Status' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedBookings.map((booking) => {
                    const bookingId = getBookingId(booking);
                    const spotId = getBookingSpotId(booking);
                    const spot =
                      spots.find((s) => getSpotId(s) === spotId) || booking.spot || null;

                    return (
                      <tr key={bookingId}>
                        <td className="booking-id-cell">{bookingId || '—'}</td>
                        <td>{spot?.spotNumber || '—'}</td>
                        <td>{getBookingDateOnly(booking.bookingDate) || '—'}</td>
                        <td>{booking.productType || '—'}</td>
                        <td>
                          {activeTab === 'past' ? (
                            <div className="booking-actions">
                              <span
                                className="booking-status-completed"
                                aria-label="Status: Completed"
                              >
                                ✓ Completed
                              </span>
                              <button
                                className="booking-history-action booking-history-rebook"
                                type="button"
                                onClick={() => handleRebook(booking)}
                                disabled={submitting || Boolean(deletingBookingId)}
                              >
                                Rebook Spot
                              </button>
                            </div>
                          ) : (
                            <div className="booking-actions">
                              <button
                                className="booking-history-action"
                                type="button"
                                onClick={() => handleEdit(booking)}
                                disabled={submitting || Boolean(deletingBookingId)}
                              >
                                Edit
                              </button>
                              <button
                                className="booking-history-action booking-history-cancel"
                                type="button"
                                onClick={() => handleDelete(booking)}
                                disabled={deletingBookingId === bookingId || submitting}
                              >
                                {deletingBookingId === bookingId ? 'Cancelling…' : 'Cancel'}
                              </button>
                            </div>
                          )}
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
    </DashboardLayout>
  );
}
