# Night Market Vendor Spot Booking System - Frontend

Welcome to the frontend repository for the Night Market Vendor Spot Booking System. This application provides a seamless platform for vendors (Members) to reserve marketplace spots and enables administrators (Admins) to manage spots, bookings, and user access efficiently.

## 🛠 Tech Stack

This project is built using modern web development technologies to ensure performance, maintainability, and a smooth developer experience:

* **Framework:** React 19 powered by Vite 8 for rapid development and HMR.
* **Routing:** React Router 7 for client-side routing.
* **HTTP Client:** Axios with a request interceptor for bearer-token authentication.
* **Styling:** CSS with responsive layouts and shared components.

## 🚀 Getting Started

Follow these instructions to set up the project on your local machine for development and testing.

### Prerequisites

Ensure you have the following installed:

* [Node.js](https://nodejs.org/) (20.19+ or 22.12+, as required by Vite 8)
* npm (comes with Node.js) or yarn

### 1. Clone the Repository

```bash
git clone <repository_url>
cd PJ05-MarketVendorBook-Frontend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Backend and CORS Configuration

The backend defaults to `PORT=5000`, so the frontend API base URL is
`http://localhost:5000/api/v1`. The backend's default `FRONTEND_URL` is
`http://localhost:3000`; run the frontend on port 3000 to match its CORS
configuration. If the backend `PORT` changes, update the frontend API base URL;
if `FRONTEND_URL` changes, run the frontend on that allowed origin.

### 4. Start the Development Server

```bash
npm run dev -- --port 3000
```

Open `http://localhost:3000` in your browser to view the application.

## Backend API Contract

### Base URL and responses

All application routes are under `http://localhost:5000/api/v1`. The backend
defaults to `PORT=5000` and `FRONTEND_URL=http://localhost:3000`.

Successful responses use `{ "success": true, "data": ... }`; list responses
also include `count`. Creation returns HTTP `201`, and other successful
operations return HTTP `200`. Errors use `{ "success": false, "error": "..." }`
with HTTP `400`, `401`, `403`, `404`, `409`, `429`, or `500`.
These error codes indicate invalid requests, missing/invalid authentication,
forbidden access, missing resources, conflicts, rate limits, and server errors,
respectively.

### Authentication

| Method and route | Access | Request |
|---|---|---|
| `POST /auth/register` | Public | `{ name, email, tel, password, role? }`; role defaults to `member` |
| `POST /auth/login` | Public | `{ email, password }` |
| `GET /auth/me` | Member or admin | Returns the authenticated user's profile and role |
| `GET /auth/logout` | Member or admin | Clears the token cookie |

Register and login return `{ id, name, email, role, token }` inside `data`;
registration defaults `role` to `member` when it is omitted.
Protected requests require `Authorization: Bearer <token>`; the auth middleware
does not authenticate from cookies. Store the bearer token in `localStorage`,
attach it to protected requests, and remove it from `localStorage` on logout.
Logout clears the cookie but does not revoke an already-issued bearer token.

### Vendor spots

| Method and route | Access | Request / behavior |
|---|---|---|
| `GET /spots` | Public | Returns active spots, sorted by zone and spot number |
| `GET /spots/:id` | Public | Returns one active spot |
| `POST /spots` | Admin | `{ spotNumber, zone, spotSize, locationDescription, rentalFee }`; all required and `rentalFee >= 0` |
| `PUT /spots/:id` | Admin | Updates an active spot; omitted fields retain their existing values |
| `DELETE /spots/:id` | Admin | Soft-deletes the spot (`isActive=false`) without deleting its bookings |

The spot identifier is returned in `_id`.
Spot data includes `_id`, `spotNumber`, `zone`, `spotSize`,
`locationDescription`, and `rentalFee`; list endpoints only return active spots.

### Bookings

| Method and route | Access | Request / behavior |
|---|---|---|
| `GET /bookings` | Member or admin | Members see their own bookings; admins see all bookings |
| `GET /bookings/:id` | Owner or admin | Returns one booking |
| `POST /bookings` | Member only | `{ spot, bookingDate, productType }` |
| `PUT /bookings/:id` | Owner or admin | `{ spot?, bookingDate?, productType? }`; omitted fields retain their values |
| `DELETE /bookings/:id` | Owner or admin | Permanently deletes the booking |

`spot` is the active spot's `_id`; `bookingDate` is a `YYYY-MM-DD` UTC date;
`productType` is non-empty free text. Admins cannot create bookings. Booking
responses contain `_id`, populated `user` and `spot` objects, and a
UTC-midnight ISO `bookingDate` such as `2026-12-01T00:00:00.000Z`. The populated
user has `_id`, `name`, and `email`; the populated spot has `_id`, `spotNumber`,
`zone`, `spotSize`, `locationDescription`, and `rentalFee`. A deleted spot may
be returned as `null`. Booking responses do not have a `status` field.

Booking dates must be valid calendar dates with `bookingDate >= todayUTC`.
Each member may book at most three spots per UTC day and may book the same spot
once per day; a spot can be occupied by only one member on a given day. Updates
exclude the booking being edited from quota checks; admin edits are checked
against the original booking owner's quota. Occupied spots and quota conflicts
return HTTP `409`. Deleting a booking immediately frees the spot and restores
the member's quota.

## 📂 Project Structure

To maintain clean architecture, the `src/` directory is organized by functionality:

```text
src/
 ├── api/                 # Axios client and authentication, spot, and booking services
 ├── assets/              # Static assets
 ├── components/
 │   ├── admin/           # Admin spot and booking forms and tables
 │   ├── booking/         # Member booking form and history table
 │   └── layout/          # Shared dashboard layout and sidebar
 ├── pages/               # Route-level page components
 ├── utils/               # Booking validation and helpers
 ├── App.jsx              # Application routes
 └── main.jsx             # Application entry point
```