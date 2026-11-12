function getSpotId(spot) {
  const id = spot._id ?? spot.id;
  return id == null ? '' : String(id);
}

function formatRentalFee(value) {
  const fee = Number(value);
  return Number.isFinite(fee) ? fee.toFixed(2) : '—';
}

export default function SpotTable({
  spots,
  loading,
  deletingSpotId,
  onEdit,
  onDelete,
}) {
  return (
    <>
      <style>{`
        .spot-list-section { padding: 27px 0 30px; }
        .spot-list-heading { margin-bottom: 15px; }
        .spot-list-heading h2 {
          margin: 0 0 5px;
          color: #0f172a;
          font-size: 19px;
          font-weight: 700;
          letter-spacing: -.015em;
        }
        .spot-list-heading p {
          color: #64748b;
          font-size: 12px;
        }
        .spot-table-wrap {
          overflow-x: auto;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          background: #fff;
        }
        .spot-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }
        .spot-table th, .spot-table td {
          padding: 12px 13px;
          border-bottom: 1px solid #e2e8f0;
          vertical-align: middle;
        }
        .spot-table th {
          background: #f8fafc;
          color: #334155;
          font-size: 11px;
          font-weight: 600;
          white-space: nowrap;
        }
        .spot-table td {
          color: #475569;
          font-size: 12px;
        }
        .spot-table tbody tr:last-child td { border-bottom: 0; }
        .spot-table tbody tr:hover { background: #fbfdff; }
        .spot-table-number { color: #0f172a !important; font-weight: 650; }
        .spot-table-description { min-width: 180px; }
        .spot-table-actions {
          display: flex;
          gap: 7px;
          white-space: nowrap;
        }
        .spot-table-action {
          min-height: 30px;
          padding: 4px 9px;
          border: 1px solid #dbe2ea;
          border-radius: 5px;
          background: #f8fafc;
          color: #334155;
          cursor: pointer;
          font: inherit;
          font-size: 11px;
          font-weight: 600;
        }
        .spot-table-action:hover { background: #eef2f6; }
        .spot-table-action:disabled { cursor: wait; opacity: .6; }
        .spot-table-delete {
          border-color: #fecaca;
          background: #fff7f7;
          color: #b42318;
        }
        .spot-table-delete:hover { background: #fff1f2; }
        .spot-table-empty {
          padding: 25px 14px !important;
          color: #64748b !important;
          text-align: center;
        }
        .spot-table-footer {
          display: flex;
          justify-content: space-between;
          padding: 10px 13px;
          background: #f8fafc;
          color: #64748b;
          font-size: 11px;
        }
        @media (max-width: 720px) {
          .spot-table { min-width: 700px; }
        }
      `}</style>

      <section className="spot-list-section" aria-labelledby="spot-list-heading">
        <div className="spot-list-heading">
          <h2 id="spot-list-heading">Spot List</h2>
          <p>All active and scheduled spots are listed below.</p>
        </div>

        <div className="spot-table-wrap">
          <table className="spot-table">
            <thead>
              <tr>
                <th scope="col">Spot Number</th>
                <th scope="col">Zone</th>
                <th scope="col">Size</th>
                <th scope="col">Description</th>
                <th scope="col">Rental Fee</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td className="spot-table-empty" colSpan="6">Loading spots…</td></tr>
              ) : spots.length === 0 ? (
                <tr>
                  <td className="spot-table-empty" colSpan="6">
                    No spots added yet. Create a new spot to get started.
                  </td>
                </tr>
              ) : (
                spots.map((spot) => {
                  const spotId = getSpotId(spot);
                  return (
                    <tr key={spotId}>
                      <td className="spot-table-number">{spot.spotNumber || '—'}</td>
                      <td>{spot.zone || '—'}</td>
                      <td>{spot.spotSize || '—'}</td>
                      <td className="spot-table-description">
                        {spot.locationDescription || '—'}
                      </td>
                      <td>{formatRentalFee(spot.rentalFee)}</td>
                      <td>
                        <div className="spot-table-actions">
                          <button
                            className="spot-table-action"
                            type="button"
                            onClick={() => onEdit(spot)}
                            disabled={Boolean(deletingSpotId)}
                          >
                            Edit
                          </button>
                          <button
                            className="spot-table-action spot-table-delete"
                            type="button"
                            onClick={() => onDelete(spot)}
                            disabled={deletingSpotId === spotId}
                          >
                            {deletingSpotId === spotId ? 'Deleting…' : 'Delete'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
          <div className="spot-table-footer">
            <span>{spots.length} {spots.length === 1 ? 'spot' : 'spots'}</span>
            <span>Page 1 of 1</span>
          </div>
        </div>
      </section>
    </>
  );
}
