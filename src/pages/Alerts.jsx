
import { useState } from "react";
import "./Alerts.css";

const initialAlerts = [
  {
    id: 1,
    title: "Client B – Ads stopped",
    description: "Balance is ₹0. Add funds to resume ads.",
    time: "10 min ago",
    type: "delivery",
    icon: "pink",
  },
  {
    id: 2,
    title: "Client A – Critical balance",
    description: "Balance ₹450, below the ₹500 limit.",
    time: "20 min ago",
    type: "balance",
    icon: "orange",
  },
  {
    id: 3,
    title: "Shootza – Low balance",
    description: "Balance ₹1,200, below ₹2,000.",
    time: "32 min ago",
    type: "balance",
    icon: "yellow",
  },
  {
    id: 4,
    title: "Client E – Low balance",
    description: "Balance ₹780, below ₹1,000.",
    time: "45 min ago",
    type: "balance",
    icon: "yellow",
  },
];

const filters = [
  { label: "All", value: "all" },
  { label: "Balance", value: "balance" },
  { label: "Delivery", value: "delivery" },
  { label: "Resolved", value: "resolved" },
];

function Alerts() {
  const [alerts, setAlerts] = useState(initialAlerts);
  const [activeFilter, setActiveFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [updated, setUpdated] = useState("11:35 AM");
  const [notified, setNotified] = useState([]);

  const counts = {
    all: alerts.length,
    balance: alerts.filter((a) => a.type === "balance").length,
    delivery: alerts.filter((a) => a.type === "delivery").length,
    resolved: 0,
  };

  const filteredAlerts = alerts.filter((alert) => {
    const matchesSearch =
      alert.title.toLowerCase().includes(search.toLowerCase()) ||
      alert.description.toLowerCase().includes(search.toLowerCase());

    const matchesFilter =
      activeFilter === "all" || alert.type === activeFilter;

    return matchesSearch && matchesFilter;
  });

  const handleRefresh = () => {
    setUpdated(
      new Date().toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      })
    );
  };

  const handleNotify = (id) => {
    setNotified((previous) =>
      previous.includes(id) ? previous : [...previous, id]
    );
  };

  return (
    <div className="alerts-page">

      {/* Header */}
      <header className="alerts-header">
        <div className="alerts-title">
          <h1>Alerts</h1>
          <p>Fix these first so ads keep running.</p>
        </div>

        <div className="alerts-actions">

          <div className="alerts-search">
            <span>⌕</span>
            <input
              type="text"
              placeholder="Search account..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="alerts-updated">
            Updated {updated}
          </div>

          <button
            className="alerts-refresh"
            onClick={handleRefresh}
          >
            Refresh
          </button>

        </div>
      </header>

      {/* Filter Tabs */}
      <div className="alerts-filters">
        {filters.map((filter) => (
          <button
            key={filter.value}
            className={`alerts-filter ${
              activeFilter === filter.value ? "active" : ""
            }`}
            onClick={() => setActiveFilter(filter.value)}
          >
            {filter.label} {counts[filter.value]}
          </button>
        ))}
      </div>

      {/* Needs Action */}
      <section className="alerts-panel">

        <div className="alerts-panel-header">
          <h2>
            {activeFilter === "resolved" ? "Resolved" : "Needs action"}
          </h2>

          <span className="alerts-limits">
            Limits: ₹2,000 • ₹1,000 • ₹500
          </span>
        </div>

        <div className="alerts-list">

          {filteredAlerts.map((alert) => (
            <div className="alerts-row" key={alert.id}>

              <div className={`alerts-icon ${alert.icon}`}>
                !
              </div>

              <div className="alerts-description">
                <h3>{alert.title}</h3>
                <p>{alert.description}</p>
              </div>

              <span className="alerts-time">
                {alert.time}
              </span>

              <button
                className={`notify-button ${
                  notified.includes(alert.id) ? "notified" : ""
                }`}
                onClick={() => handleNotify(alert.id)}
              >
                {notified.includes(alert.id) ? "Notified" : "Notify client"}
              </button>

            </div>
          ))}

          {filteredAlerts.length === 0 && (
            <div className="alerts-empty">
              No alerts found.
            </div>
          )}

        </div>

      </section>

    </div>
  );
}

export default Alerts;
