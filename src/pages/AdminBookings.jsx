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

export default function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [spots, setSpots] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingBookingId, setDeletingBookingId] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
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
          @media (max-width: 700px) {
            .admin-bookings-page { padding: 28px 18px 42px; }
            .admin-bookings-header { padding-bottom: 25px; }
          }
        `}</style>

        <header className="admin-bookings-header">
          <h1>Manage Bookings</h1>
          <p>View, update, or remove vendor spot bookings across all members.</p>
        </header>

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

        <AdminBookingTable
          bookings={bookings}
          loading={loading}
          submitting={submitting}
          deletingBookingId={deletingBookingId}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </main>
    </DashboardLayout>
  );
}
