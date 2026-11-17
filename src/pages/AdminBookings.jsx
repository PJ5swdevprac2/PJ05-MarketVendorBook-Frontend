import { useEffect, useRef, useState } from 'react';
import {
  deleteBooking,
  getAllBookings,
  updateBooking,
} from '../api/bookingApi';
import { getAllSpots } from '../api/spotApi';
import AdminBookingEditForm from '../components/admin/AdminBookingEditForm';
import AdminBookingTable from '../components/admin/AdminBookingTable';
import DashboardLayout from '../components/layout/DashboardLayout';

const emptyForm = {
  spot: '',
  bookingDate: '',
  productType: '',
};

function getBookingId(booking) {
  const id = booking._id ?? booking.id;
  return id == null ? '' : String(id);
}

// Booking dates are UTC-midnight ISO strings; slicing preserves the UTC day for date inputs.
function getBookingDateOnly(value) {
  return typeof value === 'string' ? value.slice(0, 10) : '';
}

function getErrorMessage(error) {
  return error?.response?.data?.error
    || error?.message
    || 'Something went wrong. Please try again.';
}

// ─── Heatmap Calendar Helpers ──────────────────────────────────────────────

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** Returns "YYYY-MM-DD" for a local Date object without timezone shift. */
function toLocalDateString(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Builds a Map of { "YYYY-MM-DD" → count } from bookings array. */
function buildDateCountMap(bookings) {
  const map = new Map();
  for (const b of bookings) {
    const dateKey = b.bookingDate?.slice(0, 10);
    if (dateKey) {
      map.set(dateKey, (map.get(dateKey) ?? 0) + 1);
    }
  }
  return map;
}

/** Returns the heatmap colour classes based on booking count. */
function heatColor(count) {
  if (count >= 5) return { bg: '#fcd34d', text: '#78350f', border: '#f59e0b' }; // amber-300
  if (count >= 3) return { bg: '#6ee7b7', text: '#064e3b', border: '#34d399' }; // emerald-300
  if (count >= 1) return { bg: '#d1fae5', text: '#064e3b', border: '#6ee7b7' }; // emerald-100
  return { bg: '#f8fafc', text: '#374151', border: '#e2e8f0' };                  // neutral
}

/** Builds an array of { date: Date|null } objects representing a full calendar grid. */
function buildCalendarGrid(year, month) {
  const firstDay = new Date(year, month, 1);
  const startOffset = firstDay.getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  // Pad to full weeks
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

// ─── Inline Booking Table (re-implementation using same styling) ───────────

function getTableDateOnly(value) {
  return typeof value === 'string' ? value.slice(0, 10) : '—';
}

function InlineBookingTable({
  bookings,
  loading,
  submitting,
  deletingBookingId,
  onEdit,
  onDelete,
}) {
  return (
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
                No bookings found for this date.
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
                  <td>{getTableDateOnly(booking.bookingDate)}</td>
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
  );
}

// ─── Heatmap Calendar Component ────────────────────────────────────────────

function HeatmapCalendar({
  bookings,
  loading,
  submitting,
  deletingBookingId,
  onEdit,
  onDelete,
}) {
  const todayDate = new Date();
  const [calYear, setCalYear] = useState(todayDate.getFullYear());
  const [calMonth, setCalMonth] = useState(todayDate.getMonth());
  const [selectedDate, setSelectedDate] = useState(null);

  const dateCountMap = buildDateCountMap(bookings);
  const calendarCells = buildCalendarGrid(calYear, calMonth);
  const todayStr = toLocalDateString(todayDate);

  const filteredBookings = selectedDate
    ? bookings.filter((b) => b.bookingDate?.slice(0, 10) === selectedDate)
    : bookings;

  function goToPrevMonth() {
    if (calMonth === 0) { setCalYear((y) => y - 1); setCalMonth(11); }
    else setCalMonth((m) => m - 1);
    setSelectedDate(null);
  }

  function goToNextMonth() {
    if (calMonth === 11) { setCalYear((y) => y + 1); setCalMonth(0); }
    else setCalMonth((m) => m + 1);
    setSelectedDate(null);
  }

  function goToToday() {
    setCalYear(todayDate.getFullYear());
    setCalMonth(todayDate.getMonth());
    setSelectedDate(null);
  }

  function handleDayClick(dateStr) {
    setSelectedDate((prev) => (prev === dateStr ? null : dateStr));
  }

  // Format display date nicely
  function formatSelectedDate(dateStr) {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    return dt.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  }

  return (
    <>
      <style>{`
        .heatmap-cal-wrap {
          margin-top: 28px;
        }
        /* ── Nav row ── */
        .heatmap-nav {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
          gap: 8px;
          flex-wrap: wrap;
        }
        .heatmap-nav-title {
          font-size: 17px;
          font-weight: 700;
          color: #0f172a;
          letter-spacing: -.02em;
          flex: 1;
          text-align: center;
        }
        .heatmap-nav-btn {
          padding: 6px 14px;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          background: #f8fafc;
          color: #334155;
          font: inherit;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: background .15s, border-color .15s;
          white-space: nowrap;
        }
        .heatmap-nav-btn:hover { background: #e9f0f8; border-color: #cbd5e1; }
        .heatmap-today-btn {
          padding: 6px 14px;
          border: 1px solid #c7d7f0;
          border-radius: 6px;
          background: #eff6ff;
          color: #1d4ed8;
          font: inherit;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: background .15s;
        }
        .heatmap-today-btn:hover { background: #dbeafe; }

        /* ── Grid ── */
        .heatmap-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 4px;
        }
        .heatmap-weekday {
          padding: 6px 2px;
          text-align: center;
          font-size: 11px;
          font-weight: 700;
          color: #64748b;
          letter-spacing: .04em;
          text-transform: uppercase;
        }
        .heatmap-cell {
          position: relative;
          min-height: 68px;
          padding: 7px 8px 6px;
          border-radius: 7px;
          border: 2px solid transparent;
          cursor: pointer;
          transition: transform .1s, box-shadow .1s, border-color .15s;
          display: flex;
          flex-direction: column;
          gap: 3px;
          user-select: none;
        }
        .heatmap-cell:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0,0,0,.1);
        }
        .heatmap-cell.selected {
          border-color: #3b82f6 !important;
          box-shadow: 0 0 0 3px rgba(59,130,246,.2);
        }
        .heatmap-cell.today-cell .heatmap-day-num {
          background: #3b82f6;
          color: #fff;
          border-radius: 50%;
          width: 22px;
          height: 22px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
        }
        .heatmap-cell-empty {
          border-radius: 7px;
          background: transparent;
        }
        .heatmap-day-num {
          font-size: 12px;
          font-weight: 650;
          line-height: 1;
          width: 22px;
          height: 22px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .heatmap-badge {
          margin-top: auto;
          font-size: 10px;
          font-weight: 600;
          opacity: .85;
          line-height: 1.2;
        }

        /* ── Legend ── */
        .heatmap-legend {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-top: 14px;
          flex-wrap: wrap;
        }
        .heatmap-legend-label {
          font-size: 11px;
          color: #64748b;
          font-weight: 600;
          margin-right: 4px;
        }
        .heatmap-legend-item {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 11px;
          color: #475569;
        }
        .heatmap-legend-swatch {
          width: 14px;
          height: 14px;
          border-radius: 3px;
          border: 1px solid rgba(0,0,0,.08);
          flex-shrink: 0;
        }

        /* ── Filter bar ── */
        .heatmap-filter-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 10px;
          margin: 24px 0 12px;
          padding: 12px 16px;
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          border-radius: 8px;
        }
        .heatmap-filter-text {
          font-size: 13px;
          font-weight: 600;
          color: #1e3a8a;
        }
        .heatmap-filter-text span {
          font-weight: 700;
        }
        .heatmap-filter-clear {
          padding: 5px 13px;
          border: 1px solid #93c5fd;
          border-radius: 5px;
          background: #fff;
          color: #1d4ed8;
          font: inherit;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
        }
        .heatmap-filter-clear:hover { background: #dbeafe; }

        @media (max-width: 600px) {
          .heatmap-cell { min-height: 50px; padding: 5px 5px 4px; }
          .heatmap-day-num { font-size: 11px; }
          .heatmap-badge { font-size: 9px; }
        }
      `}</style>

      <div className="heatmap-cal-wrap">
        {/* Navigation */}
        <div className="heatmap-nav">
          <button className="heatmap-nav-btn" type="button" onClick={goToPrevMonth}>
            ‹ Prev
          </button>
          <span className="heatmap-nav-title">
            {MONTH_NAMES[calMonth]} {calYear}
          </span>
          <button className="heatmap-today-btn" type="button" onClick={goToToday}>
            Today
          </button>
          <button className="heatmap-nav-btn" type="button" onClick={goToNextMonth}>
            Next ›
          </button>
        </div>

        {/* Weekday headers */}
        <div className="heatmap-grid">
          {WEEKDAY_LABELS.map((label) => (
            <div key={label} className="heatmap-weekday">{label}</div>
          ))}

          {/* Day cells */}
          {calendarCells.map((cellDate, idx) => {
            if (!cellDate) {
              return <div key={`empty-${idx}`} className="heatmap-cell-empty" />;
            }
            const dateStr = toLocalDateString(cellDate);
            const count = dateCountMap.get(dateStr) ?? 0;
            const { bg, text, border } = heatColor(count);
            const isToday = dateStr === todayStr;
            const isSelected = dateStr === selectedDate;

            return (
              <div
                key={dateStr}
                className={`heatmap-cell${isSelected ? ' selected' : ''}${isToday ? ' today-cell' : ''}`}
                style={{ backgroundColor: bg, color: text, borderColor: isSelected ? undefined : border }}
                onClick={() => handleDayClick(dateStr)}
                role="button"
                tabIndex={0}
                aria-label={`${dateStr}${count > 0 ? `, ${count} booking${count !== 1 ? 's' : ''}` : ''}`}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleDayClick(dateStr); }}
              >
                <span className="heatmap-day-num">{cellDate.getDate()}</span>
                {count > 0 && (
                  <span className="heatmap-badge">
                    {count} {count === 1 ? 'booking' : 'bookings'}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="heatmap-legend">
          <span className="heatmap-legend-label">Legend:</span>
          <div className="heatmap-legend-item">
            <div className="heatmap-legend-swatch" style={{ backgroundColor: '#f8fafc', borderColor: '#e2e8f0' }} />
            0 bookings
          </div>
          <div className="heatmap-legend-item">
            <div className="heatmap-legend-swatch" style={{ backgroundColor: '#d1fae5', borderColor: '#6ee7b7' }} />
            1–2 bookings
          </div>
          <div className="heatmap-legend-item">
            <div className="heatmap-legend-swatch" style={{ backgroundColor: '#6ee7b7', borderColor: '#34d399' }} />
            3–4 bookings
          </div>
          <div className="heatmap-legend-item">
            <div className="heatmap-legend-swatch" style={{ backgroundColor: '#fcd34d', borderColor: '#f59e0b' }} />
            5+ bookings
          </div>
        </div>

        {/* Filter bar + filtered table */}
        {selectedDate && (
          <div>
            <div className="heatmap-filter-bar">
              <p className="heatmap-filter-text">
                Showing bookings for <span>{formatSelectedDate(selectedDate)}</span>
                {' — '}
                {filteredBookings.length} {filteredBookings.length === 1 ? 'booking' : 'bookings'}
              </p>
              <button
                className="heatmap-filter-clear"
                type="button"
                onClick={() => setSelectedDate(null)}
              >
                Clear filter
              </button>
            </div>
            <InlineBookingTable
              bookings={filteredBookings}
              loading={loading}
              submitting={submitting}
              deletingBookingId={deletingBookingId}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          </div>
        )}

        {/* Show all bookings table when no date is selected */}
        {!selectedDate && (
          <div style={{ marginTop: 28 }}>
            <p style={{ fontSize: 13, color: '#64748b', marginBottom: 10 }}>
              Click any date to filter bookings. Showing all {bookings.length} booking{bookings.length !== 1 ? 's' : ''}.
            </p>
            <InlineBookingTable
              bookings={bookings}
              loading={loading}
              submitting={submitting}
              deletingBookingId={deletingBookingId}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          </div>
        )}
      </div>
    </>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────

export default function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [spots, setSpots] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingBookingId, setDeletingBookingId] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'calendar'
  const editFormRef = useRef(null);
  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    let active = true;

    async function loadPageData() {
      try {
        const [allBookings, activeSpots] = await Promise.all([
          getAllBookings(),
          getAllSpots(),
        ]);
        if (!Array.isArray(allBookings) || !Array.isArray(activeSpots)) {
          throw new Error('The server returned booking data in an unexpected format.');
        }
        if (active) {
          setBookings(allBookings);
          setSpots(activeSpots);
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

  useEffect(() => {
    if (selectedBooking) {
      editFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      editFormRef.current?.querySelector('#admin-booking-spot')?.focus({ preventScroll: true });
    }
  }, [selectedBooking]);

  async function refreshBookings() {
    const updatedBookings = await getAllBookings();
    if (!Array.isArray(updatedBookings)) {
      throw new Error('The server returned booking data in an unexpected format.');
    }
    setBookings(updatedBookings);
  }

  function handleChange(event) {
    const { name, value } = event.currentTarget;
    setFormData((current) => ({ ...current, [name]: value }));
  }

  function handleProductTypeSelect(productType) {
    setFormData((current) => ({ ...current, productType }));
  }

  function handleEdit(booking) {
    setErrorMessage('');
    setSelectedBooking(booking);
    setFormData({
      spot: booking.spot?._id == null ? '' : String(booking.spot._id),
      bookingDate: getBookingDateOnly(booking.bookingDate),
      productType: booking.productType || '',
    });
  }

  function handleCancelEdit() {
    setSelectedBooking(null);
    setFormData(emptyForm);
    setErrorMessage('');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setErrorMessage('');

    const productType = formData.productType.trim();
    if (!formData.spot || !formData.bookingDate || !productType) {
      setErrorMessage('Please select a spot, booking date, and product type.');
      return;
    }

    // Send only editable fields; the backend retains the original member as booking owner.
    const payload = {
      spot: formData.spot,
      bookingDate: formData.bookingDate,
      productType,
    };

    setSubmitting(true);
    try {
      await updateBooking(getBookingId(selectedBooking), payload);
      await refreshBookings();
      handleCancelEdit();
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(booking) {
    const bookingId = getBookingId(booking);
    if (!window.confirm(`Permanently delete booking ${bookingId}?`)) {
      return;
    }

    setErrorMessage('');
    setDeletingBookingId(bookingId);
    try {
      await deleteBooking(bookingId);
      await refreshBookings();
      if (getBookingId(selectedBooking || {}) === bookingId) {
        handleCancelEdit();
      }
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setDeletingBookingId('');
    }
  }

  return (
    <DashboardLayout>
      <main className="admin-bookings-page">
        <style>{`
          .admin-bookings-page {
            width: min(1120px, 100%);
            margin: 0 auto;
            padding: 38px 32px 54px;
            color: #0f172a;
            font: 15px/1.5 Inter, ui-sans-serif, system-ui, 'Segoe UI', sans-serif;
          }
          .admin-bookings-header {
            padding: 0 0 31px;
            border-bottom: 1px solid #e2e8f0;
            text-align: center;
          }
          .admin-bookings-header h1 {
            margin: 0 0 8px;
            color: #0f172a;
            font-size: clamp(30px, 4vw, 36px);
            font-weight: 750;
            letter-spacing: -.035em;
            line-height: 1.15;
          }
          .admin-bookings-header p {
            max-width: 560px;
            margin: 0 auto;
            color: #334155;
            font-size: 13px;
          }
          .admin-bookings-error {
            margin-top: 18px;
            padding: 11px 14px;
            border: 1px solid #fecaca;
            border-radius: 7px;
            background: #fff1f2;
            color: #b42318;
            font-size: 13px;
            font-weight: 600;
          }

          /* ── View toggle ── */
          .view-toggle {
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 28px 0 0;
            gap: 0;
          }
          .view-toggle-btn {
            padding: 8px 22px;
            border: 1px solid #e2e8f0;
            background: #f8fafc;
            color: #64748b;
            font: inherit;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            transition: background .15s, color .15s, border-color .15s;
          }
          .view-toggle-btn:first-child {
            border-radius: 7px 0 0 7px;
            border-right: none;
          }
          .view-toggle-btn:last-child {
            border-radius: 0 7px 7px 0;
          }
          .view-toggle-btn.active {
            background: #1d4ed8;
            border-color: #1d4ed8;
            color: #fff;
            z-index: 1;
          }
          .view-toggle-btn:not(.active):hover {
            background: #e9f0f8;
            color: #1e3a8a;
          }

          /* ── Shared table styles (copied from AdminBookingTable) ── */
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
          @media (max-width: 700px) {
            .admin-bookings-page { padding: 28px 18px 42px; }
            .admin-bookings-header { padding-bottom: 25px; }
          }
        `}</style>

        <header className="admin-bookings-header">
          <h1>Manage Bookings</h1>
          <p>View, update, or remove vendor spot bookings across all members.</p>
        </header>

        {/* ── View Mode Toggle ── */}
        <div className="view-toggle">
          <button
            className={`view-toggle-btn${viewMode === 'table' ? ' active' : ''}`}
            type="button"
            onClick={() => setViewMode('table')}
          >
            📋 Table View
          </button>
          <button
            className={`view-toggle-btn${viewMode === 'calendar' ? ' active' : ''}`}
            type="button"
            onClick={() => setViewMode('calendar')}
          >
            🗓 Calendar View
          </button>
        </div>

        {errorMessage && !selectedBooking && (
          <div className="admin-bookings-error" role="alert">
            {errorMessage}
          </div>
        )}

        {selectedBooking && (
          <AdminBookingEditForm
            formRef={editFormRef}
            booking={selectedBooking}
            spots={spots}
            formData={formData}
            today={today}
            submitting={submitting}
            errorMessage={errorMessage}
            onChange={handleChange}
            onProductTypeSelect={handleProductTypeSelect}
            onSubmit={handleSubmit}
            onCancel={handleCancelEdit}
          />
        )}

        {/* ── Table View ── */}
        {viewMode === 'table' && (
          <div style={{ marginTop: 28 }}>
            <AdminBookingTable
              bookings={bookings}
              loading={loading}
              submitting={submitting}
              deletingBookingId={deletingBookingId}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          </div>
        )}

        {/* ── Calendar View ── */}
        {viewMode === 'calendar' && (
          <HeatmapCalendar
            bookings={bookings}
            loading={loading}
            submitting={submitting}
            deletingBookingId={deletingBookingId}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}
      </main>
    </DashboardLayout>
  );
}
