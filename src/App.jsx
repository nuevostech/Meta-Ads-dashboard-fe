
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

// Common Layout
import AdminLayout from "./components/layout/AdminLayout";

// Pages
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import AdAccounts from "./pages/AdAccounts";
import Alerts from "./pages/Alerts";
import Performance from "./pages/Performance";
import Campaigns from "./pages/Campaigns";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";

import "./App.css";

// Check whether admin is logged in
function ProtectedRoute({ children }) {
  const token =
    localStorage.getItem("token") ||
    sessionStorage.getItem("token");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Default URL - Open Login First */}
        <Route
          path="/"
          element={<Navigate to="/login" replace />}
        />

        {/* Login Page - Without Sidebar and Topbar */}
        <Route
          path="/login"
          element={<Login />}
        />

        {/* Protected Pages - With Common Layout */}
        <Route
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route
            path="/dashboard"
            element={<Dashboard />}
          />

          <Route
            path="/ad-accounts"
            element={<AdAccounts />}
          />

          <Route
            path="/alerts"
            element={<Alerts />}
          />

          <Route
            path="/performance"
            element={<Performance />}
          />

          <Route
            path="/campaigns"
            element={<Campaigns />}
          />

          <Route
            path="/reports"
            element={<Reports />}
          />

          <Route
            path="/settings"
            element={<Settings />}
          />
        </Route>

        {/* Invalid Routes */}
        <Route
          path="*"
          element={<Navigate to="/login" replace />}
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
