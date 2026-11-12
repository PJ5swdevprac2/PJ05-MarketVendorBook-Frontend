import { useEffect, useRef, useState } from 'react';
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
  const formSectionRef = useRef(null);

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

  function handleProductTypeSelect(productType) {
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
        .bookings-header p {
          color: #334155;
          font-size: 14px;
        }
        .bookings-action-row {
          display: flex;
          justify-content: center;
          margin-top: 20px;
        }
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
        .booking-button-secondary {
          background: #fff;
          color: var(--booking-ink);
        }
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
        @media (max-width: 760px) {
          .my-bookings-page { padding: 28px 18px 48px; }
          .bookings-header { padding-bottom: 26px; }
        }
      `}</style>

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

      <BookingForm
        formSectionRef={formSectionRef}
        spots={spots}
        formData={formData}
        submitting={submitting}
        loading={loading}
        errorMessage={errorMessage}
        today={today}
        onChange={handleFormChange}
        onProductTypeSelect={handleProductTypeSelect}
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
