
import { useState, useEffect } from "react";
import "./layout.css";

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL
).replace(/\/+$/, "");

const getCurrentTime = () => {
  return new Date().toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const getToken = () =>
  localStorage.getItem("token") ||
  sessionStorage.getItem("token");

const Topbar = () => {
  const [updatedTime, setUpdatedTime] = useState(getCurrentTime());
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState(null);

  // Automatically hide toast after 3 seconds
  useEffect(() => {
    if (!toast) return;

    const timer = setTimeout(() => {
      setToast(null);
    }, 3000);

    return () => clearTimeout(timer);
  }, [toast]);

  const handleRefresh = async () => {
    if (refreshing) return;

    const token = getToken();

    if (!token) {
      setToast({
        type: "error",
        message: "Please log in again.",
      });
      return;
    }

    setRefreshing(true);
    setToast(null);

    try {
      // Run Meta synchronization once
      const response = await fetch(
        `${API_BASE_URL}/api/meta-sync/refresh`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Meta synchronization failed."
        );
      }

      if (result.skipped) {
        throw new Error(
          result.message || "Meta synchronization is already running."
        );
      }

      if (result.message === "Meta data synchronization completed") {
        window.dispatchEvent(
          new CustomEvent("dashboard-refresh", {
            detail: { source: "global-refresh" },
          })
        );

        setUpdatedTime(getCurrentTime());

        setToast({
          type: result.success ? "success" : "warning",
          message: result.success
            ? "Dashboard refreshed successfully!"
            : "Sync completed with some errors. Dashboard data reloaded.",
        });
      } else {
        throw new Error(
          result.message || "Meta synchronization failed."
        );
      }
    } catch (error) {
      console.error("Global refresh failed:", error);

      setToast({
        type: "error",
        message: error.message || "Refresh failed.",
      });
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <header className="admin-topbar">
      <div className="topbar-left">
        <h2>Meta Ads Monitoring</h2>
        <p>All client ad accounts in one place.</p>
      </div>

      <div className="topbar-actions">
        <div className="topbar-updated">
          <span className="updated-dot"></span>
          Updated {updatedTime}
        </div>

        <button
          type="button"
          className="topbar-refresh"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <span>{refreshing ? "⟳" : "↻"}</span>
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div
          className={`refresh-toast ${toast.type}`}
          role="status"
          aria-live="polite"
        >
          <span className="toast-icon">
            {toast.type === "success"
              ? "✓"
              : toast.type === "warning"
              ? "!"
              : "✕"}
          </span>

          <span className="toast-message">
            {toast.message}
          </span>
        </div>
      )}
    </header>
  );
};

export default Topbar;
