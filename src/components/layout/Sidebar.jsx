
import { NavLink } from "react-router-dom";
import "./Sidebar.css";

const menuItems = [
  { name: "Dashboard", path: "/dashboard", icon: "▦" },
  { name: "Ad Accounts", path: "/ad-accounts", icon: "▤" },
  { name: "Alerts", path: "/alerts", icon: "△", badge: 3 },
  { name: "Performance", path: "/performance", icon: "⌁" },
  { name: "Campaigns", path: "/campaigns", icon: "◁" },
  { name: "Reports", path: "/reports", icon: "▯" },
  { name: "Settings", path: "/settings", icon: "⚙" },
];

const Sidebar = ({ sidebarCollapsed, onToggleSidebar }) => {
  const adminUser = JSON.parse(
    localStorage.getItem("adminUser") ||
    sessionStorage.getItem("adminUser") ||
    "{}"
  );

  const email = adminUser.email || "Admin";
  const role = adminUser.role || "Administrator";

  const avatar = email.charAt(0).toUpperCase();

  return (
    <aside className="admin-sidebar" id="app-sidebar">

      <div className="sidebar-header">
        <div className="sidebar-brand">
          <h2>NTQS Digital</h2>
          <p>Shootza • Client accounts</p>
        </div>

        <button
          type="button"
          className="sidebar-toggle"
          onClick={onToggleSidebar}
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-controls="app-sidebar"
          aria-expanded={!sidebarCollapsed}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>

      {/* Navigation */}
      <nav className="sidebar-navigation">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? "active" : ""}`
            }
          >
            <span className="sidebar-icon">{item.icon}</span>

            <span className="sidebar-link-name">
              {item.name}
            </span>

            {item.badge && (
              <span className="sidebar-badge">
                {item.badge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom User Profile */}
      <div className="sidebar-user">
        <div className="sidebar-user-avatar">
          {avatar}
        </div>

        <div className="sidebar-user-info">
          <h4>{email}</h4>
          <p>{role}</p>
        </div>
      </div>

    </aside>
  );
};

export default Sidebar;
