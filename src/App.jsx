
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";

import Sidebar from "./components/Sidebar";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import AdAccounts from "./pages/AdAccounts";
import Alerts from "./pages/Alerts";
import Performance from "./pages/Performance";
import Campaigns from "./pages/Campaigns";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";

import "./App.css";

function AppContent() {
  const location = useLocation();

  // Login page without Sidebar
  if (location.pathname === "/login") {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
      </Routes>
    );
  }

  return (
    <div className="app-layout">
      <Sidebar />

      <main className="app-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/ad-accounts" element={<AdAccounts />} />
          <Route path="/alerts" element={<Alerts />} />
          <Route path="/performance" element={<Performance />} />
          <Route path="/campaigns" element={<Campaigns />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
