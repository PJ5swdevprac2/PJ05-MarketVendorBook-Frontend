import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  createBooking,
  deleteBooking,
  getMyBookings,
  updateBooking,
} from '../api/bookingApi';
import { getAllSpots } from '../api/spotApi';
import BookingForm from '../components/booking/BookingForm';
import BookingHistoryTable from '../components/booking/BookingHistoryTable';
import {
  getBookingDateOnly,
  getBookingId,
  getBookingSpotId,
  validateBooking,
} from '../utils/bookingValidation';

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

function getErrorMessage(error) {
  return error?.response?.data?.error
    || error?.message
    || 'Something went wrong. Please try again.';
}

export default function MyBookings() {
  const location = useLocation();
  const querySpotId = new URLSearchParams(location.search).get('spotId');
  // Prefer an explicit query parameter; router state is the fallback for internal navigation.
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
    // Ignore results if the page unmounts while its initial requests are pending.
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

  function handleFormChange(event) {
    const { name, value } = event.currentTarget;
    setFormData((current) => ({ ...current, [name]: value }));
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

    // The backend expects the selected spot ID in `spot`, not `spotId`.
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

  async function handleDelete(booking) {
    if (!window.confirm('Permanently delete this booking?')) {
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
        .bookings-message {
          padding: 22px 12px;
          color: var(--booking-muted);
          text-align: center;
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
        @media (max-width: 760px) {
          .my-bookings-page { padding: 30px 16px 48px; }
          .booking-panel { padding: 18px 14px; }
        }
      `}</style>

      <header className="bookings-header">
        <span className="bookings-eyebrow">Vendor account</span>
        <h1>My Bookings</h1>
        <p>Book a market spot and keep track of your upcoming dates.</p>
      </header>

      <BookingForm
        spots={spots}
        formData={formData}
        editingBookingId={editingBookingId}
        submitting={submitting}
        loading={loading}
        errorMessage={errorMessage}
        today={today}
        onChange={handleFormChange}
        onSubmit={handleSubmit}
        onCancelEdit={handleCancelEdit}
      />
      <BookingHistoryTable
        bookings={bookings}
        spots={spots}
        loading={loading}
        submitting={submitting}
        deletingBookingId={deletingBookingId}
        onEdit={handleEdit}
        onDeleteBooking={handleDelete}
      />
    </main>
  );
}
