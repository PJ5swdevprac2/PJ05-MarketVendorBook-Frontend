# Night Market Vendor Spot Booking System

## Project Overview

The Night Market Vendor Spot Booking System frontend helps vendors browse
market spots and manage bookings, and gives administrators tools to manage
spots and bookings. It is built with **React**, **Vite**, **Tailwind CSS**, and
**Axios**, and integrates with the PJ05 Backend REST API.

## Prerequisites & Backend Connection

- Node.js 20.19+ or 22.12+ and npm.
- Run the PJ05 Backend API at `http://localhost:5000`. The frontend API base
  URL is `http://localhost:5000/api/v1`.
- The backend's default CORS origin (`FRONTEND_URL`) is
  `http://localhost:3000`; run the frontend on port 3000.
- Protected API requests use `Authorization: Bearer <token>`. The frontend
  stores the JWT in `localStorage`; backend authentication does not use cookies.

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
- Logout clears the local authentication state and stored bearer token.
- Browse vendor spots on the Home page. The current Home page displays sample
  spot data; the public `GET /api/v1/spots` endpoint and `spotApi` service
  provide access to active backend spots.

### Member — `/my-bookings`

Members can create, view, edit, and cancel bookings. Cancelling permanently
deletes a booking.

- Booking dates use UTC `YYYY-MM-DD` values and cannot be in the past.
- A member can book at most 3 spots per UTC day.
- A member cannot book the same spot twice on the same day, and an occupied
  spot cannot be booked by another member on that day.
- `productType` is non-empty free text.

### Admin — `/admin/spots` and `/admin/bookings`

- Manage active vendor spots: create, view, update, and soft-delete.
- View, edit, and permanently delete bookings across all members.
- Admins cannot create bookings.

## Project Structure

```text
src/
├── api/                 # Axios client and auth, spot, and booking services
├── components/
│   ├── admin/           # Admin spot and booking forms and tables
│   ├── booking/         # Member booking form and history table
│   └── layout/          # Shared dashboard layout
├── contexts/            # Authentication context and provider
├── pages/               # Route-level pages
│   ├── public/          # Home, Login, and Register
│   ├── AdminSpots.jsx
│   ├── AdminBookings.jsx
│   └── MyBookings.jsx
├── utils/               # Booking validation and helpers
├── App.jsx              # Application routes and global layout
└── main.jsx             # React entry point, router, and AuthProvider
```
