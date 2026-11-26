
import { useCallback, useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import "./Sidebar.css";

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL
).replace(/\/+$/, "");

const menuItems = [
  { name: "Dashboard", path: "/dashboard", icon: "▦" },
  { name: "Ad Accounts", path: "/ad-accounts", icon: "▤" },
  { name: "Alerts", path: "/alerts", icon: "△" },
  { name: "Performance", path: "/performance", icon: "⌁" },
  { name: "Campaigns", path: "/campaigns", icon: "◁" },
  { name: "Reports", path: "/reports", icon: "▯" },
  { name: "Settings", path: "/settings", icon: "⚙" },
];

const getAdminUser = () => {
  try {
    return JSON.parse(
      localStorage.getItem("adminUser") ||
      sessionStorage.getItem("adminUser") ||
      "{}"
    );
  } catch {
    return {};
  }
};

const getToken = () =>
  localStorage.getItem("token") ||
  sessionStorage.getItem("token");

// Determine whether an alert is resolved
const isAlertResolved = (alert) => {
  if (alert.isResolved === true || alert.resolved === true) {
    return true;
  }

  const status = String(alert.status || "").toLowerCase();

  return status === "resolved";
};

const Sidebar = ({ sidebarCollapsed, onToggleSidebar }) => {
  const [activeAlertsCount, setActiveAlertsCount] = useState(0);

  const adminUser = getAdminUser();

  const email = adminUser.email || "Admin";
  const role = adminUser.role || "Administrator";

  const avatar = email.charAt(0).toUpperCase();

  // =====================================
  // FETCH ACTIVE ALERT COUNT
  // =====================================

  const fetchAlertCount = useCallback(async () => {
    try {
      const token = getToken();

      if (!token) {
        setActiveAlertsCount(0);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/alerts`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch alerts");
      }

      const result = await response.json();

      // Support common API response structures
      const alerts = Array.isArray(result.data)
        ? result.data
        : Array.isArray(result.data?.data)
          ? result.data.data
          : Array.isArray(result.alerts)
            ? result.alerts
            : [];

      const unresolvedAlerts = alerts.filter(
        (alert) => !isAlertResolved(alert)
      );

      setActiveAlertsCount(unresolvedAlerts.length);

    } catch (error) {
      console.error("Sidebar alert count error:", error.message);
    }
  }, []);

  // =====================================
  // LOAD AND REFRESH ALERT COUNT
  // =====================================

  useEffect(() => {
    fetchAlertCount();

    // Refresh when the global Refresh button is clicked
    window.addEventListener("dashboard-refresh", fetchAlertCount);

    // Refresh after resolving an alert
    window.addEventListener("alerts-updated", fetchAlertCount);

    // Refresh when returning to the application tab
    window.addEventListener("focus", fetchAlertCount);

    return () => {
      window.removeEventListener("dashboard-refresh", fetchAlertCount);
      window.removeEventListener("alerts-updated", fetchAlertCount);
      window.removeEventListener("focus", fetchAlertCount);
    };
  }, [fetchAlertCount]);

  // =====================================
  // SIDEBAR UI
  // =====================================

  return (
    <aside className="admin-sidebar" id="app-sidebar">

      {/* Sidebar Header */}
      <div className="sidebar-header">
        <div className="sidebar-brand">
          <h2>NTQS Digital</h2>
          <p>Shootza • Client accounts</p>
        </div>

        <button
          type="button"
          className="sidebar-toggle"
          onClick={onToggleSidebar}
          aria-label={
            sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"
          }
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

            {item.name === "Alerts" && activeAlertsCount > 0 && (
              <span className="sidebar-badge">
                {activeAlertsCount}
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
