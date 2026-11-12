const productTypePresets = [
  'Fresh Produce',
  'Handmade Crafts',
  'Prepared Foods',
  'Clothing & Accessories',
  'Other',
];

function getSpotId(spot) {
  const id = spot._id ?? spot.id;
  return id == null ? '' : String(id);
}

export default function AdminBookingEditForm({
  formRef,
  booking,
  spots,
  formData,
  today,
  submitting,
  errorMessage,
  onChange,
  onProductTypeSelect,
  onSubmit,
  onCancel,
}) {
  return (
    <>
      <style>{`
        .admin-booking-edit-card {
          margin: 20px 0 24px;
          padding: 21px 23px;
          border: 1px solid #e2e8f0;
          border-radius: 9px;
          background: #fff;
          box-shadow: 0 6px 18px rgba(15, 23, 42, .05);
        }
        .admin-booking-edit-heading { margin-bottom: 16px; }
        .admin-booking-edit-heading h2 {
          margin: 0 0 4px;
          color: #0f172a;
          font-size: 19px;
          font-weight: 700;
        }
        .admin-booking-edit-heading p {
          color: #64748b;
          font-size: 12px;
        }
        .admin-booking-edit-error {
          margin-bottom: 16px;
          padding: 11px 13px;
          border: 1px solid #fecaca;
          border-radius: 7px;
          background: #fff1f2;
          color: #b42318;
          font-size: 13px;
          font-weight: 600;
        }
        .admin-booking-edit-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 15px 20px;
        }
        .admin-booking-edit-field label {
          display: block;
          margin-bottom: 5px;
          color: #0f172a;
          font-size: 12px;
          font-weight: 650;
        }
        .admin-booking-edit-field input,
        .admin-booking-edit-field select {
          width: 100%;
          min-height: 39px;
          padding: 8px 10px;
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          background: #fff;
          color: #0f172a;
          font: inherit;
          font-size: 13px;
        }
        .admin-booking-edit-field input:focus,
        .admin-booking-edit-field select:focus {
          border-color: #64748b;
          outline: 3px solid rgba(15, 23, 42, .1);
        }
        .admin-booking-edit-presets {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin: 0 0 8px;
        }
        .admin-booking-edit-preset {
          min-height: 29px;
          padding: 4px 8px;
          border: 1px solid #d1d5db;
          border-radius: 5px;
          background: #f8fafc;
          color: #1e293b;
          cursor: pointer;
          font: inherit;
          font-size: 11px;
        }
        .admin-booking-edit-preset[aria-pressed='true'] {
          border-color: #111827;
          background: #f1f5f9;
        }
        .admin-booking-edit-actions {
          display: flex;
          justify-content: flex-end;
          gap: 9px;
          margin-top: 18px;
        }
        .admin-booking-edit-button {
          min-height: 37px;
          padding: 7px 15px;
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          background: #fff;
          color: #0f172a;
          cursor: pointer;
          font: inherit;
          font-size: 12px;
          font-weight: 600;
        }
        .admin-booking-edit-button:disabled { cursor: wait; opacity: .6; }
        .admin-booking-edit-save {
          border-color: #050505;
          background: #050505;
          color: #fff;
        }
        @media (max-width: 650px) {
          .admin-booking-edit-card { padding: 18px 15px; }
          .admin-booking-edit-grid { grid-template-columns: 1fr; gap: 13px; }
          .admin-booking-edit-actions { flex-direction: column-reverse; }
          .admin-booking-edit-button { width: 100%; }
        }
      `}</style>

      <section
        id="admin-booking-edit-form"
        className="admin-booking-edit-card"
        ref={formRef}
        aria-labelledby="admin-booking-edit-heading"
      >
        <div className="admin-booking-edit-heading">
          <h2 id="admin-booking-edit-heading">Edit Booking</h2>
          <p>
            Update booking for {booking.user?.name || 'this member'}.
            The member and booking owner are unchanged.
          </p>
        </div>

        {errorMessage && (
          <div className="admin-booking-edit-error" role="alert">
            {errorMessage}
          </div>
        )}

        <form onSubmit={onSubmit}>
          <div className="admin-booking-edit-grid">
            <div className="admin-booking-edit-field">
              <label htmlFor="admin-booking-spot">Spot</label>
              <select
                id="admin-booking-spot"
                name="spot"
                required
                value={formData.spot}
                onChange={onChange}
              >
                <option value="">Select an active spot</option>
                {spots.map((spot) => (
                  <option key={getSpotId(spot)} value={getSpotId(spot)}>
                    {spot.spotNumber} — {spot.zone}
                  </option>
                ))}
              </select>
            </div>
            <div className="admin-booking-edit-field">
              <label htmlFor="admin-booking-date">Booking Date (UTC)</label>
              <input
                id="admin-booking-date"
                name="bookingDate"
                type="date"
                min={today}
                required
                value={formData.bookingDate}
                onChange={onChange}
              />
            </div>
            <div className="admin-booking-edit-field" style={{ gridColumn: '1 / -1' }}>
              <label htmlFor="admin-booking-product-type">Product Type</label>
              <div className="admin-booking-edit-presets" aria-label="Product type suggestions">
                {productTypePresets.map((productType) => (
                  <button
                    key={productType}
                    className="admin-booking-edit-preset"
                    type="button"
                    aria-pressed={formData.productType === productType}
                    onClick={() => onProductTypeSelect(productType)}
                  >
                    {productType}
                  </button>
                ))}
              </div>
              <input
                id="admin-booking-product-type"
                name="productType"
                type="text"
                required
                value={formData.productType}
                onChange={onChange}
                placeholder="Enter a product type"
              />
            </div>
          </div>
          <div className="admin-booking-edit-actions">
            <button
              className="admin-booking-edit-button"
              type="button"
              onClick={onCancel}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              className="admin-booking-edit-button admin-booking-edit-save"
              type="submit"
              disabled={submitting}
            >
              {submitting ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </section>
    </>
  );
}
