import { getSpotId } from '../../utils/bookingValidation';

function formatSpot(spot) {
  const number = spot.spotNumber ? `Spot ${spot.spotNumber}` : `Spot ${getSpotId(spot)}`;
  const details = [spot.zone, spot.spotSize].filter(Boolean).join(' · ');
  return details ? `${number} — ${details}` : number;
}

function StarterMessage({ children }) {
  return <p className="bookings-message">{children}</p>;
}

export default function BookingForm({
  spots,
  formData,
  editingBookingId,
  submitting,
  loading,
  errorMessage,
  today,
  onChange,
  onSubmit,
  onCancelEdit,
}) {
  return (
    <>
      <style>{`
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
        .booking-error {
          margin: 0 0 18px;
          padding: 12px 15px;
          border: 1px solid #f1b6b6;
          border-radius: 8px;
          background: #fff0f0;
          color: #8e2020;
          font-weight: 600;
        }
        @media (max-width: 760px) {
          .booking-form-grid { grid-template-columns: 1fr; gap: 12px; }
        }
      `}</style>

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
          <form onSubmit={onSubmit}>
            <div className="booking-form-grid">
              <div className="booking-field">
                <label htmlFor="booking-spot">Spot</label>
                <select
                  id="booking-spot"
                  name="spot"
                  required
                  value={formData.spot}
                  onChange={onChange}
                >
                  <option value="">Select a spot</option>
                  {formData.spot && !spots.some((spot) => getSpotId(spot) === formData.spot) && (
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
              </div>
              <div className="booking-field">
                <label htmlFor="booking-date">Booking Date</label>
                <input
                  id="booking-date"
                  name="bookingDate"
                  type="date"
                  min={today}
                  required
                  value={formData.bookingDate}
                  onChange={onChange}
                />
              </div>
              <div className="booking-field">
                <label htmlFor="booking-product-type">Product Type</label>
                <input
                  id="booking-product-type"
                  name="productType"
                  type="text"
                  required
                  placeholder="e.g. Handmade crafts"
                  value={formData.productType}
                  onChange={onChange}
                />
              </div>
            </div>
            <div className="booking-form-actions">
              <button
                className="booking-button booking-button-primary"
                type="submit"
                disabled={submitting}
              >
                {submitting ? 'Saving…' : editingBookingId ? 'Update booking' : 'Create booking'}
              </button>
              {editingBookingId && (
                <button
                  className="booking-button booking-button-secondary"
                  type="button"
                  onClick={onCancelEdit}
                  disabled={submitting}
                >
                  Stop editing
                </button>
              )}
            </div>
          </form>
        )}
      </section>
    </>
  );
}
