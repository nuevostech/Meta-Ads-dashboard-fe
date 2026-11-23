
import { useCallback, useEffect, useRef, useState } from "react";
import "./Settings.css";

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"
).replace(/\/+$/, "");

const INITIAL_LIMITS = {
  low: "",
  critical: "",
  urgent: "",
};

const INITIAL_CHANNELS = {
  dashboard: false,
  email: false,
  whatsapp: false,
};

function getToken() {
  return (
    localStorage.getItem("token") ||
    sessionStorage.getItem("token")
  );
}

async function apiRequest(endpoint, options = {}) {
  const token = getToken();

  if (!token) {
    throw new Error("Authentication token not found. Please log in again.");
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  const result = await response.json().catch(() => null);

  if (response.status === 401 || response.status === 403) {
    throw new Error("Your session has expired. Please log in again.");
  }

  if (!response.ok || result?.success === false) {
    throw new Error(
      result?.message || `Request failed with status ${response.status}`
    );
  }

  return result;
}

function Settings() {
  const [search, setSearch] = useState("");

  const [limits, setLimits] = useState(INITIAL_LIMITS);
  const [channels, setChannels] = useState(INITIAL_CHANNELS);

  const [metaStatus, setMetaStatus] = useState({
    tokenConfigured: null,
    connectedAccounts: null,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const saveTimerRef = useRef(null);
  const revisionRef = useRef(0);
  const savingRef = useRef(false);

  // Load settings from backend.
  const loadSettings = useCallback(async () => {
    try {
      setError("");

      const result = await apiRequest("/api/settings");
      const settings = result.data;

      if (!settings) {
        throw new Error("Settings data was not returned by the server.");
      }

      setLimits({
        low: String(settings.lowBalanceThreshold ?? ""),
        critical: String(settings.criticalBalanceThreshold ?? ""),
        urgent: String(settings.urgentBalanceThreshold ?? ""),
      });

      setChannels({
        dashboard: Boolean(settings.dashboardAlertsEnabled),
        email: Boolean(settings.emailAlertsEnabled),
        whatsapp: Boolean(settings.whatsappAlertsEnabled),
      });

      setDirty(false);
    } catch (err) {
      console.error("Load Settings Error:", err);
      setError(err.message || "Unable to load settings.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Load Meta API status.
  const loadMetaStatus = useCallback(async () => {
    try {
      const result = await apiRequest("/api/settings/meta-status");

      setMetaStatus({
        tokenConfigured: Boolean(result.data?.tokenConfigured),
        connectedAccounts: Number(
          result.data?.connectedAccounts ?? 0
        ),
      });
    } catch (err) {
      console.error("Load Meta Status Error:", err);

      setMetaStatus({
        tokenConfigured: null,
        connectedAccounts: null,
      });
    }
  }, []);

  // Initial API calls.
  useEffect(() => {
    loadSettings();
    loadMetaStatus();
  }, [loadSettings, loadMetaStatus]);

  // Listen to Topbar search.
  useEffect(() => {
    const handleSearch = (event) => {
      setSearch(event.detail || "");
    };

    window.addEventListener("account-search", handleSearch);

    return () => {
      window.removeEventListener("account-search", handleSearch);
    };
  }, []);

  // Clean up pending save timer.
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, []);

  // Update balance thresholds.
  const handleLimitChange = (field, value) => {
    if (!/^\d*$/.test(value)) return;

    setLimits((previous) => ({
      ...previous,
      [field]: value,
    }));

    revisionRef.current += 1;
    setDirty(true);
    setError("");
    setSuccessMessage("");
  };

  // Toggle alert channels.
  const toggleChannel = (channel) => {
    setChannels((previous) => ({
      ...previous,
      [channel]: !previous[channel],
    }));

    revisionRef.current += 1;
    setDirty(true);
    setError("");
    setSuccessMessage("");
  };

  // Automatically save settings after changes.
  useEffect(() => {
    if (loading || !dirty) return;

    const low = Number(limits.low);
    const critical = Number(limits.critical);
    const urgent = Number(limits.urgent);

    if (
      limits.low === "" ||
      limits.critical === "" ||
      limits.urgent === ""
    ) {
      setError("Please enter all three balance thresholds.");
      return;
    }

    if (
      !Number.isFinite(low) ||
      !Number.isFinite(critical) ||
      !Number.isFinite(urgent) ||
      low < 0 ||
      critical < 0 ||
      urgent < 0
    ) {
      setError("Balance thresholds must be valid non-negative numbers.");
      return;
    }

    if (!(low > critical && critical > urgent)) {
      setError(
        "Thresholds must be ordered: Low greater than Critical, and Critical greater than Urgent."
      );
      return;
    }

    const currentRevision = revisionRef.current;

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = setTimeout(async () => {
      if (savingRef.current) return;

      savingRef.current = true;
      setSaving(true);
      setError("");
      setSuccessMessage("");

      try {
        await apiRequest("/api/settings", {
          method: "PUT",
          body: JSON.stringify({
            lowBalanceThreshold: low,
            criticalBalanceThreshold: critical,
            urgentBalanceThreshold: urgent,
            dashboardAlertsEnabled: channels.dashboard,
            emailAlertsEnabled: channels.email,
            whatsappAlertsEnabled: channels.whatsapp,
          }),
        });

        if (revisionRef.current === currentRevision) {
          setDirty(false);
          setSuccessMessage("Settings saved successfully.");
        }
      } catch (err) {
        console.error("Save Settings Error:", err);
        setError(err.message || "Unable to save settings.");
      } finally {
        savingRef.current = false;
        setSaving(false);
      }
    }, 700);

    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, [limits, channels, dirty, loading]);

  // Manually refresh Meta Ads data using the Topbar refresh event.

  // Listen to Topbar refresh event.
useEffect(() => {
  const handleRefresh = () => {
    loadMetaStatus();
  };

  window.addEventListener("dashboard-refresh", handleRefresh);

  return () => {
    window.removeEventListener("dashboard-refresh", handleRefresh);
  };
}, [loadMetaStatus]);

  // Search settings sections.
  const normalizedSearch = search.trim().toLowerCase();

  const showBalanceLimits =
    !normalizedSearch ||
    "balance limits low critical urgent refresh interval".includes(
      normalizedSearch
    );

  const showAlertChannels =
    !normalizedSearch ||
    "alert channels dashboard email whatsapp notifications".includes(
      normalizedSearch
    );

  const showMetaApi =
    !normalizedSearch ||
    "meta api connected accounts prepaid balance connection token".includes(
      normalizedSearch
    );

  const metaConnected = metaStatus.tokenConfigured === true;

  const metaConnectionText =
    metaStatus.tokenConfigured === null
      ? "Status unavailable"
      : metaConnected
        ? "Token configured"
        : "Token not configured";

  return (
    <div className="settings-page">
      {/* Page Heading */}
      <div className="settings-header">
        <div>
          <h1>Settings</h1>
          <p>Alert limits, channels and refresh timing.</p>
        </div>
      </div>

      {/* Feedback */}
      {(error || successMessage || saving) && (
        <div className="settings-feedback" role="status">
          {error && (
            <span className="settings-error">{error}</span>
          )}

          {saving && <span>Saving settings...</span>}

        

          {!error && !saving && successMessage && (
            <span className="settings-saved">
              ✓ {successMessage}
            </span>
          )}
        </div>
      )}

      <section className="settings-grid">
        {/* Balance Limits */}
        {showBalanceLimits && (
          <div className="settings-card balance-limits-card">
            <div className="settings-card-heading">
              <div>
                <h2>Balance limits</h2>
                <p>Configure account balance thresholds</p>
              </div>

              <span className="settings-card-icon">₹</span>
            </div>

            {loading ? (
              <p>Loading balance settings...</p>
            ) : (
              <>
                <div className="limit-list">
                  <div className="limit-row">
                    <label className="limit-label" htmlFor="low-limit">
                      <span className="limit-dot low-dot"></span>
                      Low
                    </label>

                    <div className="limit-input-wrapper">
                      <span>₹</span>
                      <input
                        id="low-limit"
                        type="number"
                        min="0"
                        value={limits.low}
                        onChange={(e) =>
                          handleLimitChange("low", e.target.value)
                        }
                      />
                    </div>
                  </div>

                  <div className="limit-row">
                    <label
                      className="limit-label"
                      htmlFor="critical-limit"
                    >
                      <span className="limit-dot critical-dot"></span>
                      Critical
                    </label>

                    <div className="limit-input-wrapper">
                      <span>₹</span>
                      <input
                        id="critical-limit"
                        type="number"
                        min="0"
                        value={limits.critical}
                        onChange={(e) =>
                          handleLimitChange("critical", e.target.value)
                        }
                      />
                    </div>
                  </div>

                  <div className="limit-row">
                    <label
                      className="limit-label"
                      htmlFor="urgent-limit"
                    >
                      <span className="limit-dot urgent-dot"></span>
                      Urgent
                    </label>

                    <div className="limit-input-wrapper">
                      <span>₹</span>
                      <input
                        id="urgent-limit"
                        type="number"
                        min="0"
                        value={limits.urgent}
                        onChange={(e) =>
                          handleLimitChange("urgent", e.target.value)
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="refresh-settings">
                  <h3>Refresh</h3>

                  <div className="refresh-options">
                    <button
                      type="button"
                      className="selected"
                      disabled
                    >
                      12 hours
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Alert Channels */}
        {showAlertChannels && (
          <div className="settings-card alert-channels-card">
            <div className="settings-card-heading">
              <div>
                <h2>Alert channels</h2>
                <p>Choose where alerts are delivered</p>
              </div>

              <span className="settings-card-icon">!</span>
            </div>

            {loading ? (
              <p>Loading alert channel settings...</p>
            ) : (
              <div className="channel-list">
                <div className="channel-row">
                  <div>
                    <span className="channel-name">Dashboard</span>
                    <p>In-app notifications</p>
                  </div>

                  <button
                    type="button"
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
                  <div>
                    <span className="channel-name">Email</span>
                    <p>Email notifications</p>
                  </div>

                  <button
                    type="button"
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
                  <div>
                    <span className="channel-name">
                      WhatsApp (version 2)
                    </span>
                    <p>WhatsApp notifications</p>
                  </div>

                  <button
                    type="button"
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
            )}
          </div>
        )}

        {/* Meta API */}
        {showMetaApi && (
          <div className="settings-card meta-api-card">
            <div className="settings-card-heading">
              <div>
                <h2>Meta API</h2>
                <p>Account connection status</p>
              </div>

              <span className="meta-status-icon">
                {metaConnected ? "✓" : "!"}
              </span>
            </div>

            <div className="meta-connection">
              <span
                className="meta-status-dot"
                style={{
                  backgroundColor: metaConnected ? "#16a34a" : "#dc2626",
                }}
              ></span>

              <h3>{metaConnectionText}</h3>
            </div>

            <p className="meta-account-count">
              {metaStatus.connectedAccounts === null
                ? "Account count unavailable"
                : `${metaStatus.connectedAccounts} ad accounts linked`}
            </p>

            <div className="meta-api-divider"></div>

            <p className="meta-api-description">
              {metaConnected
                ? "Meta access token is configured. Account count is retrieved from the backend."
                : metaStatus.tokenConfigured === false
                  ? "Configure META_ACCESS_TOKEN in the backend environment to enable Meta API access."
                  : "Unable to retrieve Meta API status."}
            </p>
          </div>
        )}

        {!showBalanceLimits &&
          !showAlertChannels &&
          !showMetaApi && (
            <div className="settings-empty">
              No matching settings found.
            </div>
          )}
      </section>
    </div>
  );
}

export default Settings;
