function normalizeId(value) {
  if (value && typeof value === 'object') {
    value = value.id ?? value._id ?? value.spotId;
  }
  return value == null ? '' : String(value);
}

export function getBookingDateOnly(value) {
  return typeof value === 'string' ? value.slice(0, 10) : '';
}

export function getSpotId(spot) {
  return normalizeId(spot?.id ?? spot?._id ?? spot?.spotId);
}

export function getBookingSpotId(booking) {
  return normalizeId(
    booking.spotId ?? booking.spot?.id ?? booking.spot?._id ?? booking.spot,
  );
}

export function getBookingId(booking) {
  return normalizeId(booking._id ?? booking.id ?? booking.bookingId);
}

/**
 * Validate a member booking; an edited booking is excluded from that day's
 * capacity and duplicate-spot checks.
 */
export function validateBooking({
  spot,
  bookingDate,
  productType,
  spots,
  bookings,
  editingBookingId,
  today,
}) {
  if (!spot || !spots.some((availableSpot) => getSpotId(availableSpot) === spot)) {
    return 'Please select an available spot.';
  }
  if (!bookingDate) {
    return 'Please select a booking date.';
  }
  if (bookingDate < today) {
    return 'Booking date cannot be in the past.';
  }
  if (!productType) {
    return 'Please select a product type.';
  }

  const otherBookingsForDate = bookings.filter((booking) => (
    getBookingId(booking) !== editingBookingId
    && getBookingDateOnly(booking.bookingDate) === bookingDate
  ));

  if (otherBookingsForDate.length >= 3) {
    return 'You can book a maximum of 3 spots per day.';
  }
  if (otherBookingsForDate.some((booking) => getBookingSpotId(booking) === spot)) {
    return 'You already have a booking for this spot on that date.';
  }

  return '';
}
