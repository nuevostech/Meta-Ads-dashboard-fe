
import { useState } from "react";
import { Outlet } from "react-router-dom";

import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import "./layout.css";

const AdminLayout = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    () => window.innerWidth <= 550
  );

  return (
    <div
      className={`admin-layout ${
        sidebarCollapsed ? "sidebar-collapsed" : ""
      }`}
    >

      {/* Fixed Sidebar */}
      <Sidebar
        sidebarCollapsed={sidebarCollapsed}
        onToggleSidebar={() =>
          setSidebarCollapsed((collapsed) => !collapsed)
        }
      />

      {/* Main Content Area */}
      <div className="admin-main">

        {/* Common Fixed Topbar */}
        <Topbar />

        {/* Individual Page Content */}
        <main className="admin-content">
          <Outlet />
        </main>

      </div>

    </div>
  );
};

export default AdminLayout;
