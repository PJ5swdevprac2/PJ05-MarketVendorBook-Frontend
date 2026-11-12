# Night Market Vendor Spot Booking System

## Project Overview

The Night Market Vendor Spot Booking System frontend lets vendors browse market
spots and manage bookings, while providing separate experiences for members
and administrators. It is built with **React**, **Vite**, **Tailwind CSS**, and
**Axios**, and connects to the PJ05 Backend REST API.

## Prerequisites & Backend Connection

- Node.js 20.19+ or 22.12+ and npm.
- Run the PJ05 Backend API at `http://localhost:5000`. The frontend API base
  URL is `http://localhost:5000/api/v1`.
- The backend's default CORS origin (`FRONTEND_URL`) is
  `http://localhost:3000`; run the frontend on port 3000.
- Protected API requests use `Authorization: Bearer <token>`. The frontend
  stores the JWT in `localStorage`; the backend does not authenticate from
  cookies.

## Installation & Running

From the frontend project directory:

```bash
npm install
npm run dev -- --port 3000
```

Open [http://localhost:3000](http://localhost:3000). The extra `--port 3000`
ensures Vite uses the origin allowed by the backend. Running `npm run dev`
without a port option uses Vite's default port, which may not match the
backend's CORS configuration.

## Key Features & Roles

### Public / Auth

- Register and log in as a member or admin.
- Keep the JWT bearer token in the client session and clear it on logout.
- Browse vendor spots on the Home page. The current Home page uses sample spot
  data; the public `GET /api/v1/spots` endpoint and `spotApi` service are
  available for active backend spots.

### Member — `/my-bookings`

The protected member page uses the spot and booking APIs to create, view, edit,
and cancel bookings. Cancellation permanently deletes the booking.

- Booking dates use UTC `YYYY-MM-DD` values and cannot be in the past.
- A member can book at most 3 spots per UTC day.
- A member cannot book the same spot twice on the same day, and an occupied
  spot cannot be booked by another member for that day.
- `productType` is non-empty free text.

### Admin — `/admin/spots` and `/admin/bookings`

The backend permits admins to create, view, update, and soft-delete spots, and
to view, edit, and permanently delete member bookings. Admins cannot create
bookings. The frontend routes are protected, but the current Admin pages still
show “Coming soon” placeholders; the API service functions are available for
these operations.

## Project Structure

```text
src/
├── api/                 # Axios client and auth, spot, and booking services
├── components/          # Shared UI, auth, navigation, and booking components
├── contexts/            # Authentication context and provider
├── pages/               # Route-level pages: public pages and My Bookings
├── utils/               # Booking validation and helpers
├── App.jsx              # Application routes and global layout
└── main.jsx             # React entry point, router, and AuthProvider
```
