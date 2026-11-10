# Night Market Vendor Spot Booking System - Frontend

Welcome to the frontend repository for the Night Market Vendor Spot Booking System. This application provides a seamless platform for vendors (Members) to reserve marketplace spots and enables administrators (Admins) to manage spots, bookings, and user access efficiently.

## 🛠 Tech Stack

This project is built using modern web development technologies to ensure performance, maintainability, and a smooth developer experience:

* **Framework:** [React 18](https://react.dev/) powered by [Vite](https://vitejs.dev/) for rapid development and HMR.
* **Routing:** [React Router v6](https://reactrouter.com/) for declarative routing and protected route management.
* **HTTP Client:** [Axios](https://axios-http.com/) configured with interceptors for seamless JWT authentication handling.
* **Styling:** Tailwind CSS for utility-first, responsive design.

## 🚀 Getting Started

Follow these instructions to set up the project on your local machine for development and testing.

### Prerequisites

Ensure you have the following installed:

* [Node.js](https://nodejs.org/) (v16.x or higher recommended)
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

### 3. Environment Configuration

To connect the frontend to the backend API, you need to set up your local environment variables.

1. **Copy the example file:** In the root directory (alongside `package.json`), duplicate the `.env.example` file and rename the copy to `.env`.
   *(If you are using a terminal, you can run: `cp .env.example .env`)*
2. **Configure the API URL:** Open the newly created `.env` file and ensure the `VITE_API_BASE_URL` matches the port where your local backend is running (e.g., port 3000, 8080, etc.).

```env
# Example content of .env
VITE_API_BASE_URL=http://localhost:3000/api
```

*(Note: The `.env` file is included in `.gitignore` by default. Never commit real credentials or production tokens to the repository.)*

### 4. Start the Development Server

```bash
npm run dev
```

The Vite server will start, typically running on `http://localhost:5173`. Open this URL in your browser to view the application.

## 📂 Project Structure

To maintain clean architecture, the `src/` directory is organized by functionality:

```text
src/
 ├── api/               # API service layers categorized by domain (e.g., authApi.js, spotApi.js)
 ├── assets/            # Static assets like images, icons, and global stylesheets
 ├── components/        # Reusable UI components (e.g., Buttons, Modals, Navbar, Cards)
 ├── contexts/          # React Context providers (e.g., AuthContext for global state)
 ├── pages/             # Route-level components (Views)
 │   ├── admin/         # Admin-specific views (Dashboard, Spot Management)
 │   ├── public/        # Publicly accessible views (Home, Login, Register)
 │   └── user/          # Member-specific views (My Bookings)
 ├── utils/             # Helper functions and utilities (e.g., date formatting, validation)
 ├── App.jsx            # Root component encompassing routing and layout
 └── main.jsx           # Application entry point rendering into the DOM
```