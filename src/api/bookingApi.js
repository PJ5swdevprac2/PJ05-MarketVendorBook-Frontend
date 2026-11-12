import axiosClient from './axiosClient';

function getDateOffset(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const mockBookings = [
  {
    id: 1,
    spotId: 1,
    userId: 1,
    bookingDate: getDateOffset(1),
    productType: 'Food',
    status: 'confirmed',
  },
  {
    id: 2,
    spotId: 2,
    userId: 1,
    bookingDate: getDateOffset(1),
    productType: 'Drinks',
    status: 'confirmed',
  },
  {
    id: 3,
    spotId: 3,
    userId: 2,
    bookingDate: getDateOffset(1),
    productType: 'Clothing',
    status: 'confirmed',
  },
];

const useMockData = import.meta.env.VITE_USE_MOCK === 'true';

function getBookingDay(bookingDate) {
  if (typeof bookingDate !== 'string') {
    throw new Error('กรุณาระบุวันที่จองให้ถูกต้อง');
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(bookingDate);
  if (!match) {
    throw new Error('กรุณาระบุวันที่จองให้ถูกต้อง');
  }

  const [, year, month, day] = match;
  const parsedDate = new Date(Number(year), Number(month) - 1, Number(day));
  if (
    parsedDate.getFullYear() !== Number(year)
    || parsedDate.getMonth() !== Number(month) - 1
    || parsedDate.getDate() !== Number(day)
  ) {
    throw new Error('กรุณาระบุวันที่จองให้ถูกต้อง');
  }

  return `${year}-${month}-${day}`;
}

function validateBooking(booking, existingBookings) {
  const bookingDay = getBookingDay(booking.bookingDate);
  const today = getDateOffset(0);

  if (bookingDay < today) {
    throw new Error('ไม่สามารถจองวันที่ผ่านมาแล้วได้');
  }

  const userBookingsForDay = existingBookings.filter(
    (existingBooking) => existingBooking.userId === booking.userId
      && getBookingDay(existingBooking.bookingDate) === bookingDay,
  );

  if (userBookingsForDay.length >= 3) {
    throw new Error('ผู้ใช้ไม่สามารถจองได้เกิน 3 ล็อกในวันเดียวกัน');
  }
}

function loadBookings() {
  if (useMockData) {
    return new Promise((resolve) => {
      setTimeout(() => resolve([...mockBookings]), 500);
    });
  }

  return axiosClient.get('/bookings').then(({ data }) => data);
}

export function getMyBookings() {
  return loadBookings();
}

export function getAllBookings() {
  return loadBookings();
}

export const getBookings = getMyBookings;

export async function createBooking(bookingData) {
  if (useMockData) {
    validateBooking(bookingData, mockBookings);
    const newBooking = {
      ...bookingData,
      id: Math.max(0, ...mockBookings.map((booking) => booking.id)) + 1,
    };
    mockBookings.push(newBooking);
    return newBooking;
  }

  const bookingDay = getBookingDay(bookingData.bookingDate);
  if (bookingDay < getDateOffset(0)) {
    throw new Error('ไม่สามารถจองวันที่ผ่านมาแล้วได้');
  }

  const { data: existingBookings } = await axiosClient.get('/bookings');
  validateBooking(bookingData, existingBookings);
  const { data } = await axiosClient.post('/bookings', bookingData);
  return data;
}

export function updateBooking(bookingId, updateData) {
  if (useMockData) {
    const index = mockBookings.findIndex((booking) => booking.id === bookingId);
    if (index === -1) {
      throw new Error('ไม่พบข้อมูลการจองที่ต้องการแก้ไข');
    }

    mockBookings[index] = { ...mockBookings[index], ...updateData };
    return Promise.resolve(mockBookings[index]);
  }

  return axiosClient.put(`/bookings/${bookingId}`, updateData).then(({ data }) => data);
}

export function deleteBooking(bookingId) {
  if (useMockData) {
    const index = mockBookings.findIndex((booking) => booking.id === bookingId);
    if (index === -1) {
      throw new Error('ไม่พบข้อมูลการจองที่ต้องการลบ');
    }

    const [deletedBooking] = mockBookings.splice(index, 1);
    return Promise.resolve(deletedBooking);
  }

  return axiosClient.delete(`/bookings/${bookingId}`).then(({ data }) => data);
}
