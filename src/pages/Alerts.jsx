
import { useState, useEffect, useCallback, useMemo } from "react";
import "./Alerts.css";

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL
).replace(/\/+$/, "");

const API_URL = `${API_BASE_URL}/api/alerts`;

const filters = [
  { label: "All", value: "all" },
  { label: "Balance", value: "balance" },
  { label: "Delivery", value: "delivery" },
  { label: "Resolved", value: "resolved" },
];

const getToken = () =>
  localStorage.getItem("token") ||
  sessionStorage.getItem("token");

// =====================================
// FORMAT ALERT TIME
// =====================================

const formatAlertTime = (dateValue) => {
  if (!dateValue) return "Time unavailable";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "Time unavailable";
  }

  const difference = Math.max(
    0,
    Date.now() - date.getTime()
  );

  const minutes = Math.floor(difference / 60000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.floor(minutes / 60);

  if (hours < 24) return `${hours} hr ago`;

  const days = Math.floor(hours / 24);

  if (days < 30) return `${days} days ago`;

  return date.toLocaleDateString("en-IN");
};

// =====================================
// NORMALIZE BACKEND ALERT
// =====================================

const normalizeAlert = (alert) => {
  const rawType = String(
    alert.type ??
    alert.alertType ??
    alert.alert_type ??
    alert.category ??
    alert.alertCategory ??
    ""
  ).toLowerCase();

  const title =
    alert.title ||
    alert.alertTitle ||
    alert.alert_title ||
    alert.message ||
    alert.description ||
    "Account Alert";

  const description =
    alert.description ||
    alert.message ||
    alert.alertMessage ||
    alert.alert_message ||
    "Please review this account alert.";

  const combinedText = `${rawType} ${title} ${description}`.toLowerCase();

  const type =
    combinedText.includes("delivery") ||
    combinedText.includes("stopped") ||
    combinedText.includes("payment") ||
    combinedText.includes("campaign")
      ? "delivery"
      : "balance";

  let icon = "yellow";

  if (
    combinedText.includes("urgent") ||
    combinedText.includes("critical") ||
    combinedText.includes("stopped")
  ) {
    icon = "orange";
  } else if (type === "delivery") {
    icon = "pink";
  }

  return {
    id: alert.id ?? alert.alertId ?? alert.alert_id,
    title,
    description,
    time: formatAlertTime(
      alert.createdAt ??
      alert.created_at ??
      alert.triggeredAt ??
      alert.triggered_at ??
      alert.updatedAt
    ),
    type,
    icon,
    originalData: alert,
  };
};

function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [resolvedAlerts, setResolvedAlerts] = useState([]);
  const [activeFilter, setActiveFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [notified, setNotified] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [resolvingId, setResolvingId] = useState(null);

  // =====================================
  // FETCH ALERTS API
  // =====================================

  const fetchAlerts = useCallback(async () => {
    try {
      setRefreshing(true);
      setError("");

      const token = getToken();

      if (!token) {
        throw new Error(
          "Authentication token not found. Please login again."
        );
      }

      const response = await fetch(API_URL, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (response.status === 401 || response.status === 403) {
        throw new Error(
          "Session expired or access denied. Please login again."
        );
      }

      if (!response.ok || data.success === false) {
        throw new Error(
          data.message || "Failed to fetch alerts."
        );
      }

      // Supports common backend response structures
      const alertList = Array.isArray(data)
        ? data
        : Array.isArray(data.alerts)
        ? data.alerts
        : Array.isArray(data.data)
        ? data.data
        : Array.isArray(data.data?.alerts)
        ? data.data.alerts
        : [];

      const normalizedAlerts = alertList
        .map(normalizeAlert)
        .filter((alert) => alert.id !== null && alert.id !== undefined);

      setAlerts(normalizedAlerts);

    } catch (err) {
      console.error("Fetch Alerts Error:", err);
      setError(err.message || "Unable to load alerts.");
      setAlerts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // =====================================
  // INITIAL API CALL
  // =====================================

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  // =====================================
  // GLOBAL SEARCH
  // =====================================

  useEffect(() => {
    const handleGlobalSearch = (event) => {
      setSearch(event.detail || "");
    };

    window.addEventListener(
      "account-search",
      handleGlobalSearch
    );

    return () => {
      window.removeEventListener(
        "account-search",
        handleGlobalSearch
      );
    };
  }, []);

  // =====================================
  // GLOBAL REFRESH EVENT
  // =====================================

  useEffect(() => {
    const handleGlobalRefresh = () => {
      fetchAlerts();
    };

    window.addEventListener(
      "dashboard-refresh",
      handleGlobalRefresh
    );

    return () => {
      window.removeEventListener(
        "dashboard-refresh",
        handleGlobalRefresh
      );
    };
  }, [fetchAlerts]);

  

  // =====================================
  // ALERT COUNTS
  // =====================================

  const counts = useMemo(() => {
    return {
      all: alerts.length,
      balance: alerts.filter(
        (alert) => alert.type === "balance"
      ).length,
      delivery: alerts.filter(
        (alert) => alert.type === "delivery"
      ).length,
      resolved: resolvedAlerts.length,
    };
  }, [alerts, resolvedAlerts]);

  // =====================================
  // SEARCH AND FILTER
  // =====================================

  const filteredAlerts = useMemo(() => {
    const sourceAlerts =
      activeFilter === "resolved"
        ? resolvedAlerts
        : alerts;

    return sourceAlerts.filter((alert) => {
      const matchesFilter =
        activeFilter === "all" ||
        activeFilter === "resolved" ||
        alert.type === activeFilter;

      const searchText = search.trim().toLowerCase();

      const matchesSearch =
        alert.title.toLowerCase().includes(searchText) ||
        alert.description.toLowerCase().includes(searchText);

      return matchesFilter && matchesSearch;
    });
  }, [alerts, resolvedAlerts, activeFilter, search]);

  // =====================================
  // NOTIFY CLIENT
  // =====================================

  const handleNotify = (id) => {
    setNotified((previous) =>
      previous.includes(id)
        ? previous
        : [...previous, id]
    );
  };

  // =====================================
  // RESOLVE ALERT API
  // =====================================

  const handleResolve = async (id) => {
    if (resolvingId !== null) return;

    try {
      setResolvingId(id);

      const token = getToken();

      if (!token) {
        throw new Error(
          "Authentication token not found. Please login again."
        );
      }

      const response = await fetch(
        `${API_URL}/${encodeURIComponent(id)}/resolve`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (response.status === 401 || response.status === 403) {
        throw new Error(
          "Session expired or access denied. Please login again."
        );
      }

      if (!response.ok || data.success === false) {
        throw new Error(
          data.message || "Failed to resolve alert."
        );
      }

      const resolvedAlert = alerts.find(
        (alert) => String(alert.id) === String(id)
      );

      if (resolvedAlert) {
        setAlerts((previous) =>
          previous.filter(
            (alert) => String(alert.id) !== String(id)
          )
        );

        setResolvedAlerts((previous) => [
          ...previous,
          {
            ...resolvedAlert,
            time: "Resolved just now",
          },
        ]);
      }

      setNotified((previous) =>
        previous.filter(
          (notifiedId) => String(notifiedId) !== String(id)
        )
      );

    } catch (err) {
      console.error("Resolve Alert Error:", err);
      setError(err.message || "Unable to resolve alert.");
    } finally {
      setResolvingId(null);
    }
  };

  // =====================================
  // RENDER
  // =====================================

  return (
    <div className="alerts-page">

      {/* PAGE HEADER */}

      <header className="alerts-header">
        <div className="alerts-title">
          <h1>Alerts</h1>
          <p>
            Fix these first so ads keep running.
          </p>
        </div>

        {/* <button
          type="button"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          {refreshing ? "Refreshing..." : "Refresh"}
        </button> */}
      </header>

      {/* ALERT SUMMARY */}

      <section className="alerts-summary">

        <div className="alerts-summary-card">
          <span>Total Active Alerts</span>
          <h2>{counts.all}</h2>
        </div>

        <div className="alerts-summary-card balance-summary">
          <span>Balance Alerts</span>
          <h2>{counts.balance}</h2>
        </div>

        <div className="alerts-summary-card delivery-summary">
          <span>Delivery Alerts</span>
          <h2>{counts.delivery}</h2>
        </div>

        <div className="alerts-summary-card resolved-summary">
          <span>Resolved</span>
          <h2>{counts.resolved}</h2>
        </div>

      </section>

      {/* FILTER TABS */}

      <div className="alerts-filters">
        {filters.map((filter) => (
          <button
            type="button"
            key={filter.value}
            className={`alerts-filter ${
              activeFilter === filter.value ? "active" : ""
            }`}
            onClick={() => setActiveFilter(filter.value)}
          >
            {filter.label}

            <span className="alerts-filter-count">
              {counts[filter.value]}
            </span>
          </button>
        ))}
      </div>

      {/* ALERTS PANEL */}

      <section className="alerts-panel">

        <div className="alerts-panel-header">

          <div>
            <h2>
              {activeFilter === "resolved"
                ? "Resolved Alerts"
                : "Needs Action"}
            </h2>

            <p>
              {activeFilter === "resolved"
                ? "Previously resolved alerts."
                : "Accounts that need your attention."}
            </p>
          </div>

          <div className="alerts-panel-right">

            {refreshing && (
              <span className="alerts-refreshing">
                Refreshing...
              </span>
            )}

            <span className="alerts-limits">
              Limits: ₹2,000 • ₹1,000 • ₹500
            </span>

          </div>

        </div>

        {/* ERROR */}

        {error && (
          <div className="alerts-empty">
            <h3>Unable to process alerts</h3>
            <p>{error}</p>

            <button
  type="button"
  onClick={fetchAlerts}
  disabled={refreshing}
>
  {refreshing ? "Refreshing..." : "Try Again"}
</button>
          </div>
        )}

        {/* LOADING */}

        {loading && (
          <div className="alerts-empty">
            <h3>Loading alerts...</h3>
            <p>Please wait while we fetch alerts.</p>
          </div>
        )}

        {/* ALERT LIST */}

        {!loading && !error && (
          <div className="alerts-list">

            {filteredAlerts.map((alert) => {
              const isNotified = notified.includes(alert.id);
              const isResolved =
                activeFilter === "resolved";

              return (
                <div className="alerts-row" key={alert.id}>

                  {/* Icon */}

                  <div className={`alerts-icon ${alert.icon}`}>
                    !
                  </div>

                  {/* Description */}

                  <div className="alerts-description">
                    <h3>{alert.title}</h3>
                    <p>{alert.description}</p>
                  </div>

                  {/* Time */}

                  <span className="alerts-time">
                    {alert.time}
                  </span>

                  {/* Actions */}

                  <div className="alerts-row-actions">

                    {!isResolved && (
                      <>
                        <button
                          type="button"
                          className={`notify-button ${
                            isNotified ? "notified" : ""
                          }`}
                          onClick={() => handleNotify(alert.id)}
                        >
                          {isNotified
                            ? "Notified"
                            : "Notify client"}
                        </button>

                        <button
                          type="button"
                          className="resolve-button"
                          disabled={resolvingId !== null}
                          onClick={() => handleResolve(alert.id)}
                        >
                          {resolvingId === alert.id
                            ? "Resolving..."
                            : "Resolve"}
                        </button>
                      </>
                    )}

                    {isResolved && (
                      <span className="resolved-label">
                        Resolved
                      </span>
                    )}

                  </div>

                </div>
              );
            })}

            {/* EMPTY STATE */}

            {filteredAlerts.length === 0 && (
              <div className="alerts-empty">

                <div className="alerts-empty-icon">
                  ✓
                </div>

                <h3>No alerts found</h3>

                <p>
                  Try changing your search or selected filter.
                </p>

                <button
                  type="button"
                  onClick={() => {
                    setActiveFilter("all");
                    setSearch("");
                  }}
                >
                  View All Alerts
                </button>

              </div>
            )}

          </div>
        )}

      </section>

    </div>
  );
}

export default Alerts;
