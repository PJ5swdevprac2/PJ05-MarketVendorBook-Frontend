import axiosClient from './axiosClient';

function getUtcDateOffset(days) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

const mockBookings = [
  {
    _id: 1,
    spot: { _id: 1, spotNumber: 'A01', zone: 'Food', spotSize: '3x3m' },
    bookingDate: getUtcDateOffset(1),
    productType: 'Food',
  },
  {
    _id: 2,
    spot: { _id: 2, spotNumber: 'B01', zone: 'Clothing', spotSize: '3x2m' },
    bookingDate: getUtcDateOffset(1),
    productType: 'Drinks',
  },
  {
    _id: 3,
    spot: { _id: 3, spotNumber: 'C01', zone: 'Crafts', spotSize: '2x2m' },
    bookingDate: getUtcDateOffset(1),
    productType: 'Clothing',
  },
];

const useMockData = import.meta.env.VITE_USE_MOCK === 'true';

function loadBookings() {
  if (useMockData) {
    return new Promise((resolve) => {
      setTimeout(() => resolve([...mockBookings]), 500);
    });
  }

  return axiosClient.get('/bookings').then(({ data }) => data.data);
}

export function getMyBookings() {
  return loadBookings();
}

export function getAllBookings() {
  return loadBookings();
}

export const getBookings = getMyBookings;

export function createBooking(bookingData) {
  if (useMockData) {
    const newBooking = {
      ...bookingData,
      _id: Math.max(0, ...mockBookings.map((booking) => Number(booking._id))) + 1,
    };
    mockBookings.push(newBooking);
    return Promise.resolve(newBooking);
  }

  return axiosClient.post('/bookings', bookingData).then(({ data }) => data.data);
}

export function updateBooking(bookingId, updateData) {
  if (useMockData) {
    const index = mockBookings.findIndex((booking) => String(booking._id) === String(bookingId));
    if (index === -1) {
      throw new Error('ไม่พบข้อมูลการจองที่ต้องการแก้ไข');
    }

    mockBookings[index] = { ...mockBookings[index], ...updateData };
    return Promise.resolve(mockBookings[index]);
  }

  return axiosClient.put(`/bookings/${bookingId}`, updateData).then(({ data }) => data.data);
}

export function deleteBooking(bookingId) {
  if (useMockData) {
    const index = mockBookings.findIndex((booking) => String(booking._id) === String(bookingId));
    if (index === -1) {
      throw new Error('ไม่พบข้อมูลการจองที่ต้องการลบ');
    }

    const [deletedBooking] = mockBookings.splice(index, 1);
    return Promise.resolve(deletedBooking);
  }

  return axiosClient.delete(`/bookings/${bookingId}`).then(({ data }) => data.data);
}
