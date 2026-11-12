import { useEffect, useRef, useState } from 'react';
import {
  createSpot,
  deleteSpot,
  getAllSpots,
  updateSpot,
} from '../api/spotApi';
import SpotForm from '../components/admin/SpotForm';
import SpotTable from '../components/admin/SpotTable';
import DashboardLayout from '../components/layout/DashboardLayout';

const emptySpotForm = {
  spotNumber: '',
  zone: '',
  spotSize: '',
  locationDescription: '',
  rentalFee: '',
};

function getSpotId(spot) {
  const id = spot._id ?? spot.id;
  return id == null ? '' : String(id);
}

function getErrorMessage(error) {
  return error?.response?.data?.error
    || error?.message
    || 'Something went wrong. Please try again.';
}

export default function AdminSpots() {
  const [spots, setSpots] = useState([]);
  const [formData, setFormData] = useState(emptySpotForm);
  const [editingSpotId, setEditingSpotId] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingSpotId, setDeletingSpotId] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const formSectionRef = useRef(null);

  useEffect(() => {
    let active = true;

    async function loadSpots() {
      try {
        const availableSpots = await getAllSpots();
        if (!Array.isArray(availableSpots)) {
          throw new Error('The server returned spot data in an unexpected format.');
        }
        if (active) {
          setSpots(availableSpots);
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

    loadSpots();
    return () => {
      active = false;
    };
  }, []);

  async function refreshSpots() {
    const updatedSpots = await getAllSpots();
    if (!Array.isArray(updatedSpots)) {
      throw new Error('The server returned spot data in an unexpected format.');
    }
    setSpots(updatedSpots);
  }

  function resetForm() {
    setFormData(emptySpotForm);
    setEditingSpotId('');
    setErrorMessage('');
  }

  function handleNewSpot() {
    resetForm();
    formSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    formSectionRef.current?.querySelector('#spot-number')?.focus({ preventScroll: true });
  }

  function handleChange(event) {
    const { name, value } = event.currentTarget;
    setFormData((current) => ({ ...current, [name]: value }));
  }

  function validateForm() {
    if (
      !formData.spotNumber.trim()
      || !formData.zone.trim()
      || !formData.spotSize.trim()
      || !formData.locationDescription.trim()
      || formData.rentalFee.trim() === ''
    ) {
      return 'Please complete all required spot fields.';
    }

    const rentalFee = Number(formData.rentalFee);
    if (!Number.isFinite(rentalFee) || rentalFee < 0) {
      return 'Rental fee must be a number greater than or equal to zero.';
    }

    return '';
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setErrorMessage('');

    const validationMessage = validateForm();
    if (validationMessage) {
      setErrorMessage(validationMessage);
      return;
    }

    // Keep the API schema's rentalFee numeric while trimming all text fields.
    const spotData = {
      spotNumber: formData.spotNumber.trim(),
      zone: formData.zone.trim(),
      spotSize: formData.spotSize.trim(),
      locationDescription: formData.locationDescription.trim(),
      rentalFee: Number(formData.rentalFee),
    };

    setSubmitting(true);
    try {
      if (editingSpotId) {
        await updateSpot(editingSpotId, spotData);
      } else {
        await createSpot(spotData);
      }
      await refreshSpots();
      resetForm();
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  function handleEdit(spot) {
    setErrorMessage('');
    setEditingSpotId(getSpotId(spot));
    setFormData({
      spotNumber: spot.spotNumber || '',
      zone: spot.zone || '',
      spotSize: spot.spotSize || '',
      locationDescription: spot.locationDescription || '',
      rentalFee: spot.rentalFee == null ? '' : String(spot.rentalFee),
    });
    formSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    formSectionRef.current?.querySelector('#spot-number')?.focus({ preventScroll: true });
  }

  async function handleDelete(spot) {
    const spotId = getSpotId(spot);
    const spotName = spot.spotNumber || spotId;
    if (!window.confirm(`Delete spot ${spotName}? It will be deactivated for future bookings.`)) {
      return;
    }

    setErrorMessage('');
    setDeletingSpotId(spotId);
    try {
      await deleteSpot(spotId);
      await refreshSpots();
      if (editingSpotId === spotId) {
        resetForm();
      }
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setDeletingSpotId('');
    }
  }

  return (
    <DashboardLayout>
      <main className="admin-spots-page">
        <style>{`
          .admin-spots-page {
            --admin-ink: #0f172a;
            --admin-muted: #64748b;
            width: min(1120px, 100%);
            margin: 0 auto;
            padding: 38px 32px 0;
            color: var(--admin-ink);
            font: 15px/1.5 Inter, ui-sans-serif, system-ui, 'Segoe UI', sans-serif;
          }
          .admin-spots-header {
            padding: 0 0 31px;
            border-bottom: 1px solid #e2e8f0;
            text-align: center;
          }
          .admin-spots-header h1 {
            margin: 0 0 8px;
            color: var(--admin-ink);
            font-size: clamp(30px, 4vw, 36px);
            font-weight: 750;
            letter-spacing: -.035em;
            line-height: 1.15;
          }
          .admin-spots-header p {
            max-width: 560px;
            margin: 0 auto;
            color: #334155;
            font-size: 13px;
          }
          .admin-spots-create-button {
            min-height: 40px;
            margin-top: 17px;
            padding: 8px 20px;
            border: 1px solid #050505;
            border-radius: 6px;
            background: #050505;
            color: #fff;
            cursor: pointer;
            font: inherit;
            font-size: 12px;
            font-weight: 600;
          }
          .admin-spots-create-button:hover { background: #1e293b; }
          .admin-spots-error {
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
            .admin-spots-page { padding: 28px 18px 0; }
            .admin-spots-header { padding-bottom: 25px; }
          }
        `}</style>

        <header className="admin-spots-header">
          <h1>Manage Spots</h1>
          <p>
            Create, update, and remove stalls/spots for the night market.
            Keep zone assignments and fees up to date.
          </p>
          <button
            className="admin-spots-create-button"
            type="button"
            onClick={handleNewSpot}
          >
            Create New Spot
          </button>
        </header>

        {errorMessage && (
          <div className="admin-spots-error" role="alert">
            {errorMessage}
          </div>
        )}

        <SpotTable
          spots={spots}
          loading={loading}
          deletingSpotId={deletingSpotId}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
        <SpotForm
          formRef={formSectionRef}
          formData={formData}
          editingSpotId={editingSpotId}
          submitting={submitting}
          onChange={handleChange}
          onSubmit={handleSubmit}
          onCancel={resetForm}
        />
      </main>
    </DashboardLayout>
  );
}
