export default function SpotForm({
  formRef,
  formData,
  editingSpotId,
  submitting,
  onChange,
  onSubmit,
  onCancel,
}) {
  const isEditing = Boolean(editingSpotId);

  return (
    <>
      <style>{`
        .spot-form-section {
          padding: 34px 0 52px;
          background: #f8fafc;
        }
        .spot-form-heading {
          margin: 0 auto 20px;
          text-align: center;
        }
        .spot-form-heading h2 {
          margin: 0 0 6px;
          color: #0f172a;
          font-size: 23px;
          font-weight: 700;
          letter-spacing: -.02em;
        }
        .spot-form-heading p {
          max-width: 470px;
          margin: 0 auto;
          color: #64748b;
          font-size: 13px;
        }
        .spot-form-card {
          max-width: 960px;
          margin: 0 auto;
          padding: 25px 28px 20px;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          background: #fff;
          box-shadow: 0 8px 24px rgba(15, 23, 42, .07);
        }
        .spot-form-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px 22px;
        }
        .spot-form-field label {
          display: block;
          margin-bottom: 5px;
          color: #0f172a;
          font-size: 12px;
          font-weight: 650;
        }
        .spot-form-field input {
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
        .spot-form-field input:focus {
          border-color: #64748b;
          outline: 3px solid rgba(15, 23, 42, .1);
        }
        .spot-form-field-wide { grid-column: 1 / -1; }
        .spot-form-help {
          display: block;
          margin-top: 3px;
          color: #64748b;
          font-size: 11px;
        }
        .spot-form-actions {
          display: flex;
          justify-content: center;
          gap: 10px;
          margin-top: 20px;
        }
        .spot-form-button {
          min-width: 128px;
          min-height: 39px;
          padding: 8px 16px;
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          background: #fff;
          color: #0f172a;
          cursor: pointer;
          font: inherit;
          font-size: 13px;
          font-weight: 600;
        }
        .spot-form-button:disabled { cursor: wait; opacity: .6; }
        .spot-form-save {
          border-color: #050505;
          background: #050505;
          color: #fff;
        }
        @media (max-width: 650px) {
          .spot-form-section { padding: 28px 0 40px; }
          .spot-form-card { padding: 20px 16px; }
          .spot-form-grid { grid-template-columns: 1fr; gap: 13px; }
          .spot-form-field-wide { grid-column: auto; }
        }
        @media (max-width: 420px) {
          .spot-form-actions { flex-direction: column-reverse; }
          .spot-form-button { width: 100%; }
        }
      `}</style>

      <section className="spot-form-section" ref={formRef} tabIndex={-1}>
        <div className="spot-form-heading">
          <h2>{isEditing ? 'Update Spot' : 'Create New Spot'}</h2>
          <p>Enter details for the spot. All fields are required.</p>
        </div>

        <form className="spot-form-card" onSubmit={onSubmit}>
          <div className="spot-form-grid">
            <div className="spot-form-field">
              <label htmlFor="spot-number">Spot Number</label>
              <input
                id="spot-number"
                name="spotNumber"
                type="text"
                placeholder="e.g., SPOT-014"
                required
                value={formData.spotNumber}
                onChange={onChange}
              />
              <span className="spot-form-help">Required</span>
            </div>
            <div className="spot-form-field">
              <label htmlFor="spot-zone">Zone</label>
              <input
                id="spot-zone"
                name="zone"
                type="text"
                placeholder="e.g., Food Court A"
                required
                value={formData.zone}
                onChange={onChange}
              />
              <span className="spot-form-help">Required</span>
            </div>
            <div className="spot-form-field">
              <label htmlFor="spot-size">Size</label>
              <input
                id="spot-size"
                name="spotSize"
                type="text"
                placeholder="e.g., 3 m x 2 m"
                required
                value={formData.spotSize}
                onChange={onChange}
              />
              <span className="spot-form-help">Required</span>
            </div>
            <div className="spot-form-field">
              <label htmlFor="spot-description">Description</label>
              <input
                id="spot-description"
                name="locationDescription"
                type="text"
                placeholder="Short location notes"
                required
                value={formData.locationDescription}
                onChange={onChange}
              />
              <span className="spot-form-help">Required</span>
            </div>
            <div className="spot-form-field spot-form-field-wide">
              <label htmlFor="spot-rental-fee">Rental Fee</label>
              <input
                id="spot-rental-fee"
                name="rentalFee"
                type="number"
                min="0"
                step="0.01"
                placeholder="e.g., 150.00"
                required
                value={formData.rentalFee}
                onChange={onChange}
              />
              <span className="spot-form-help">Required. Must be zero or greater.</span>
            </div>
          </div>

          <div className="spot-form-actions">
            <button
              className="spot-form-button"
              type="button"
              onClick={onCancel}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              className="spot-form-button spot-form-save"
              type="submit"
              disabled={submitting}
            >
              {submitting ? 'Saving…' : isEditing ? 'Update Spot' : 'Save Spot'}
            </button>
          </div>
        </form>
      </section>
    </>
  );
}
