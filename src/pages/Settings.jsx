
import { useState } from "react";
import "./Settings.css";

function Settings() {
  const [search, setSearch] = useState("");
  const [updated, setUpdated] = useState("11:35 AM");

  const [limits, setLimits] = useState({
    low: "₹2,000",
    critical: "₹1,000",
    urgent: "₹500",
  });

  const [channels, setChannels] = useState({
    dashboard: true,
    email: true,
    whatsapp: false,
  });

  const [refreshInterval, setRefreshInterval] = useState("30 min");

  const handleRefresh = () => {
    setUpdated(
      new Date().toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      })
    );
  };

  const toggleChannel = (channel) => {
    setChannels((previous) => ({
      ...previous,
      [channel]: !previous[channel],
    }));
  };

  return (
    <div className="settings-page">

      {/* Header */}
      <header className="settings-header">

        <div className="settings-title">
          <h1>Settings</h1>
          <p>Alert limits, channels and refresh timing.</p>
        </div>

        <div className="settings-actions">

          <div className="settings-search">
            <span>⌕</span>
            <input
              type="text"
              placeholder="Search account..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="settings-updated">
            Updated {updated}
          </div>

          <button
            className="settings-refresh"
            onClick={handleRefresh}
          >
            Refresh
          </button>

        </div>

      </header>

      {/* Settings Cards */}
      <section className="settings-grid">

        {/* Balance Limits */}
        <div className="settings-card balance-limits-card">

          <h2>Balance limits</h2>

          <div className="limit-list">

            <div className="limit-row">
              <span className="limit-label">
                <span className="limit-dot"></span>
                Low
              </span>

              <span className="limit-value">
                {limits.low}
              </span>
            </div>

            <div className="limit-row">
              <span className="limit-label">
                <span className="limit-dot"></span>
                Critical
              </span>

              <span className="limit-value">
                {limits.critical}
              </span>
            </div>

            <div className="limit-row">
              <span className="limit-label">
                <span className="limit-dot"></span>
                Urgent
              </span>

              <span className="limit-value">
                {limits.urgent}
              </span>
            </div>

          </div>

          <div className="refresh-settings">
            <h3>Refresh</h3>

            <div className="refresh-options">
              {["15 min", "30 min"].map((option) => (
                <button
                  key={option}
                  className={
                    refreshInterval === option ? "selected" : ""
                  }
                  onClick={() => setRefreshInterval(option)}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Alert Channels */}
        <div className="settings-card alert-channels-card">

          <h2>Alert channels</h2>

          <div className="channel-list">

            <div className="channel-row">
              <span>Dashboard</span>

              <button
                className={`toggle-switch ${
                  channels.dashboard ? "on" : ""
                }`}
                onClick={() => toggleChannel("dashboard")}
                aria-label="Toggle Dashboard alerts"
                aria-pressed={channels.dashboard}
              >
                <span></span>
              </button>
            </div>

            <div className="channel-row">
              <span>Email</span>

              <button
                className={`toggle-switch ${
                  channels.email ? "on" : ""
                }`}
                onClick={() => toggleChannel("email")}
                aria-label="Toggle Email alerts"
                aria-pressed={channels.email}
              >
                <span></span>
              </button>
            </div>

            <div className="channel-row">
              <span>WhatsApp (version 2)</span>

              <button
                className={`toggle-switch ${
                  channels.whatsapp ? "on" : ""
                }`}
                onClick={() => toggleChannel("whatsapp")}
                aria-label="Toggle WhatsApp alerts"
                aria-pressed={channels.whatsapp}
              >
                <span></span>
              </button>
            </div>

          </div>

        </div>

        {/* Meta API */}
        <div className="settings-card meta-api-card">

          <h2>Meta API</h2>

          <h3>Connected</h3>

          <p className="meta-account-count">
            12 ad accounts linked
          </p>

          <p className="meta-api-description">
            Prepaid balance access is still to be confirmed
            with the dev team.
          </p>

        </div>

      </section>

    </div>
  );
}

export default Settings;
