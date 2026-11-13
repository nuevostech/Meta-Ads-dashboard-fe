import { NavLink } from "react-router-dom";
import "./Sidebar.css";

const menuItems = [
  { icon: "▦", name: "Dashboard", path: "/" },
  { icon: "▤", name: "Ad Accounts", path: "/ad-accounts" },
  { icon: "△", name: "Alerts", path: "/alerts", count: 3 },
  { icon: "⌁", name: "Performance", path: "/performance" },
  { icon: "◁", name: "Campaigns", path: "/campaigns" },
  { icon: "▯", name: "Reports", path: "/reports" },
  { icon: "⚙", name: "Settings", path: "/settings" },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <h3>NTQS Digital</h3>
        <p>Shootza • Client accounts</p>
      </div>

      <nav className="sidebar-navigation">
        {menuItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            end={item.path === "/"}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? "active" : ""}`
            }
          >
            <span className="sidebar-icon">{item.icon}</span>
            <span>{item.name}</span>

            {item.count && (
              <span className="sidebar-count">{item.count}</span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-user">
        <div className="sidebar-avatar">TK</div>
        <span>Thanvi K.</span>
      </div>
    </aside>
  );
}