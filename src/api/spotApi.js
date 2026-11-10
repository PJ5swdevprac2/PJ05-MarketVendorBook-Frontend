import axiosClient from './axiosClient';

const mockSpots = [
  {
    id: 1,
    spotNumber: 'A01',
    zone: 'Food',
    spotSize: '3x3m',
    locationDescription: 'Near the main entrance',
    rentalFee: 500,
  },
  {
    id: 2,
    spotNumber: 'B01',
    zone: 'Clothing',
    spotSize: '3x2m',
    locationDescription: 'Along the central walkway',
    rentalFee: 400,
  },
  {
    id: 3,
    spotNumber: 'C01',
    zone: 'Crafts',
    spotSize: '2x2m',
    locationDescription: 'Beside the community stage',
    rentalFee: 300,
  },
];

const useMockData = import.meta.env.VITE_USE_MOCK === 'true';

export function getSpots() {
  if (useMockData) {
    return new Promise((resolve) => {
      setTimeout(() => resolve(mockSpots), 500);
    });
  }

  return axiosClient.get('/spots').then(({ data }) => data);
}

export function createSpot(spotData) {
  return axiosClient.post('/spots', spotData).then(({ data }) => data);
}

export function updateSpot(id, spotData) {
  return axiosClient.put(`/spots/${id}`, spotData).then(({ data }) => data);
}

export function deleteSpot(id) {
  return axiosClient.delete(`/spots/${id}`).then(({ data }) => data);
}
