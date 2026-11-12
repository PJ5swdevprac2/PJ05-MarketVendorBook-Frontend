import { NavLink } from 'react-router-dom';

const navigationItems = [
  { label: 'Home', to: '/', icon: 'home' },
  { label: 'My Bookings', to: '/my-bookings', icon: 'booking' },
  { label: 'Manage Spots', to: '/admin/spots', icon: 'spot' },
  { label: 'Manage Bookings', to: '/admin/bookings', icon: 'manage' },
];

function NavigationIcon({ name }) {
  const paths = {
    home: (
      <>
        <path d="m3 10 9-7 9 7" />
        <path d="M5 9v11h14V9M9 20v-6h6v6" />
      </>
    ),
    booking: (
      <>
        <rect x="4" y="5" width="16" height="16" rx="2" />
        <path d="M8 3v4m8-4v4M4 10h16M8 14h3m-3 3h6" />
      </>
    ),
    spot: (
      <>
        <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
        <circle cx="12" cy="10" r="2.5" />
      </>
    ),
    manage: (
      <>
        <rect x="5" y="3" width="14" height="18" rx="2" />
        <path d="M8 8h8M8 12h8M8 16h5" />
      </>
    ),
  };

  return (
    <svg
      className="dashboard-nav-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}

export default function DashboardLayout({ children }) {
  return (
    <>
      <style>{`
        .dashboard-layout {
          display: flex;
          min-height: 100vh;
          background: #fff;
          color: #0f172a;
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        .dashboard-sidebar {
          position: sticky;
          top: 0;
          display: flex;
          flex: 0 0 238px;
          flex-direction: column;
          height: 100vh;
          padding: 22px 14px;
          border-right: 1px solid #e2e8f0;
          background: #f8fafc;
        }
        .dashboard-brand {
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 0 8px 30px;
          color: #111827;
          font-size: 15px;
          font-weight: 700;
          white-space: nowrap;
        }
        .dashboard-brand-mark {
          display: grid;
          width: 30px;
          height: 30px;
          flex: 0 0 30px;
          place-items: center;
          border-radius: 50%;
          background: #e2e8f0;
          color: #334155;
          font-size: 13px;
          font-weight: 750;
        }
        .dashboard-nav {
          display: grid;
          gap: 5px;
        }
        .dashboard-nav-link {
          display: flex;
          min-height: 40px;
          align-items: center;
          gap: 11px;
          padding: 8px 10px;
          border-radius: 6px;
          color: #334155;
          font-size: 13px;
          font-weight: 550;
          text-decoration: none;
          transition: background-color .15s ease, color .15s ease;
        }
        .dashboard-nav-link:hover { background: #eef2f6; color: #0f172a; }
        .dashboard-nav-link.is-active {
          background: #e8edf3;
          color: #0f172a;
          font-weight: 700;
        }
        .dashboard-nav-icon {
          width: 17px;
          height: 17px;
          flex: 0 0 17px;
          color: #64748b;
        }
        .dashboard-nav-link.is-active .dashboard-nav-icon { color: #1e293b; }
        .dashboard-content {
          min-width: 0;
          flex: 1;
        }
        @media (max-width: 760px) {
          .dashboard-layout { flex-direction: column; }
          .dashboard-sidebar {
            position: static;
            width: 100%;
            height: auto;
            flex-basis: auto;
            padding: 12px 14px;
            border-right: 0;
            border-bottom: 1px solid #e2e8f0;
          }
          .dashboard-brand { margin: 0 3px 10px; }
          .dashboard-nav {
            display: flex;
            flex-wrap: wrap;
            gap: 4px;
          }
          .dashboard-nav-link {
            min-height: 36px;
            gap: 7px;
            padding: 7px 8px;
            font-size: 12px;
          }
          .dashboard-nav-icon { width: 15px; height: 15px; flex-basis: 15px; }
        }
      `}</style>

      <div className="dashboard-layout">
        <aside className="dashboard-sidebar" aria-label="Dashboard sidebar">
          <div className="dashboard-brand">
            <span className="dashboard-brand-mark" aria-hidden="true">N</span>
            <span>Night Market</span>
          </div>
          <nav className="dashboard-nav" aria-label="Dashboard navigation">
            {navigationItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) => (
                  `dashboard-nav-link${isActive ? ' is-active' : ''}`
                )}
              >
                <NavigationIcon name={item.icon} />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </aside>
        <div className="dashboard-content">{children}</div>
      </div>
    </>
  );
}
