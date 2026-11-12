import { getSpotId } from '../../utils/bookingValidation';

const productTypePresets = [
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

function StarterMessage({ children }) {
  return <p className="bookings-message">{children}</p>;
}

export default function BookingForm({
  formSectionRef,
  spots,
  formData,
  submitting,
  loading,
  errorMessage,
  today,
  onChange,
  onProductTypeSelect,
  onSubmit,
  onCancelEdit,
}) {
  return (
    <>
      <style>{`
        .booking-error {
          margin: 0 0 18px;
          padding: 12px 15px;
          border: 1px solid #fecaca;
          border-radius: 8px;
          background: #fff1f2;
          color: #b42318;
          font-weight: 600;
        }
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
        .booking-form-content {
          grid-column: span 7;
          min-width: 0;
        }
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
        .booking-date-help {
          display: block;
          margin-top: 4px;
          color: #dc2626;
          font-size: 12px;
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
        .booking-form-actions .booking-button {
          min-height: 44px;
        }
        @media (max-width: 800px) {
          .booking-form-panel {
            grid-template-columns: 1fr;
            gap: 24px;
            padding: 34px 0;
          }
          .booking-form-intro, .booking-form-content { grid-column: 1 / -1; }
        }
        @media (max-width: 480px) {
          .booking-form-actions { grid-template-columns: 1fr; }
        }
      `}</style>

      {errorMessage && (
        <div className="booking-error" role="alert">
          {errorMessage}
        </div>
      )}

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
            <StarterMessage>Loading spots and bookings…</StarterMessage>
          ) : (
            <form onSubmit={onSubmit}>
              <div className="booking-fields">
                <div className="booking-field">
                  <label htmlFor="booking-spot">Select Spot</label>
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
                  <span className="booking-date-help">
                    * Cannot select past dates. Max 3 spots per day.
                  </span>
                </div>

                <div className="booking-field">
                  <label htmlFor="booking-product-type">Product Type</label>
                  <div className="product-type-presets" aria-label="Product type suggestions">
                    {productTypePresets.map((productType) => (
                      <button
                        key={productType}
                        className="product-type-preset"
                        type="button"
                        aria-pressed={formData.productType === productType}
                        onClick={() => onProductTypeSelect(productType)}
                      >
                        {productType}
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
                    onChange={onChange}
                  />
                </div>
              </div>

              <div className="booking-form-actions">
                <button
                  className="booking-button booking-button-secondary"
                  type="button"
                  onClick={onCancelEdit}
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
    </>
  );
}
