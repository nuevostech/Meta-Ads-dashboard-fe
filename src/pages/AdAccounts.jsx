
import { useState, useEffect, useCallback, useMemo } from "react";
import "./AdAccounts.css";

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL
).replace(/\/+$/, "");

const API_URL = `${API_BASE_URL}/api/ad-accounts`;

const filters = [
  { label: "All", value: "all" },
  { label: "Healthy", value: "healthy" },
  { label: "Low Balance", value: "low" },
  { label: "Critical", value: "critical" },
  { label: "Stopped", value: "stopped" },
];

const money = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;

// Get the admin authentication token
const getToken = () =>
  localStorage.getItem("token") ||
  sessionStorage.getItem("token");

// Convert backend account data into the format used by this UI
const normalizeAccount = (account) => {
  const balance = Number(
    account.availableBalance ??
    account.available_balance ??
    account.currentBalance ??
    account.balance ??
    0
  );

  const spend = Number(
    account.todaySpend ??
    account.today_spend ??
    account.dailySpend ??
    account.daily_spend ??
    account.spend ??
    account.totalSpend ??
    account.total_spend ??
    0
  );

  const backendStatus = String(
    account.balanceStatus ??
    account.balance_status ??
    account.accountStatus ??
    account.account_status ??
    account.status ??
    ""
  ).toLowerCase();

  let type = "healthy";
  let status = "Healthy";

  if (
    backendStatus.includes("stopped") ||
    backendStatus.includes("disabled") ||
    backendStatus.includes("inactive")
  ) {
    type = "stopped";
    status = "Ads Stopped";
  } else if (
    backendStatus.includes("urgent") ||
    backendStatus.includes("critical")
  ) {
    type = "critical";
    status = backendStatus.includes("urgent")
      ? "Urgent"
      : "Critical";
  } else if (
    backendStatus.includes("low")
  ) {
    type = "low";
    status = "Low Balance";
  } else {
    // Fallback when the backend does not provide a balance status
    if (balance <= 0) {
      type = "stopped";
      status = "Ads Stopped";
    } else if (balance <= 500) {
      type = "critical";
      status = "Critical";
    } else if (balance <= 2000) {
      type = "low";
      status = "Low Balance";
    }
  }

  return {
    id: account.id ?? account.accountId ?? account.account_id,
    name:
      account.accountName ??
      account.account_name ??
      account.name ??
      account.businessName ??
      account.accountId ??
      account.account_id ??
      "Unnamed Account",
    balance,
    spend,
    status,
    type,
  };
};

export default function AdAccounts() {
  const [accounts, setAccounts] = useState([]);
  const [activeFilter, setActiveFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // =====================================
  // FETCH AD ACCOUNTS API
  // =====================================

  const fetchAdAccounts = useCallback(async () => {
    try {
      setRefreshing(true);
      setError("");

      const token = getToken();

      if (!token) {
        throw new Error("Authentication token not found. Please login again.");
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
        throw new Error("Session expired or access denied. Please login again.");
      }

      if (!response.ok || data.success === false) {
        throw new Error(
          data.message || "Failed to fetch ad accounts."
        );
      }

      // Supports common API response formats
      const accountList = Array.isArray(data)
        ? data
        : Array.isArray(data.accounts)
        ? data.accounts
        : Array.isArray(data.data)
        ? data.data
        : Array.isArray(data.data?.accounts)
        ? data.data.accounts
        : [];

      setAccounts(accountList.map(normalizeAccount));
    } catch (err) {
      console.error("Ad Accounts API Error:", err);
      setError(err.message || "Unable to load ad accounts.");
      setAccounts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial API call
  useEffect(() => {
    fetchAdAccounts();
  }, [fetchAdAccounts]);

  // =====================================
  // GLOBAL SEARCH EVENT
  // =====================================

  useEffect(() => {
    const handleGlobalSearch = (event) => {
      setSearch(event.detail || "");
    };

    window.addEventListener("account-search", handleGlobalSearch);

    return () => {
      window.removeEventListener("account-search", handleGlobalSearch);
    };
  }, []);

  // =====================================
  // GLOBAL REFRESH EVENT
  // =====================================

  useEffect(() => {
  const handleGlobalRefresh = () => {
    fetchAdAccounts();
  };

  window.addEventListener("dashboard-refresh", handleGlobalRefresh);

  return () => {
    window.removeEventListener("dashboard-refresh", handleGlobalRefresh);
  };
}, [fetchAdAccounts]);

  // =====================================
  // MANUAL REFRESH
  // =====================================

  

  // =====================================
  // ACCOUNT COUNTS
  // =====================================

  const counts = useMemo(() => ({
    all: accounts.length,
    healthy: accounts.filter(
      (account) => account.type === "healthy"
    ).length,
    low: accounts.filter(
      (account) => account.type === "low"
    ).length,
    critical: accounts.filter(
      (account) => account.type === "critical"
    ).length,
    stopped: accounts.filter(
      (account) => account.type === "stopped"
    ).length,
  }), [accounts]);

  // =====================================
  // FILTER AND SEARCH
  // =====================================

  const filteredAccounts = useMemo(() => {
    return accounts.filter((account) => {
      const matchesFilter =
        activeFilter === "all" ||
        account.type === activeFilter;

      const matchesSearch = account.name
        .toLowerCase()
        .includes(search.trim().toLowerCase());

      return matchesFilter && matchesSearch;
    });
  }, [accounts, activeFilter, search]);

  // =====================================
  // RENDER
  // =====================================

  return (
    <div className="ad-accounts-page">

      {/* PAGE HEADER */}

      <div className="ad-accounts-header">
        <div>
          <h1>Ad Accounts</h1>
          <p>
            Monitor prepaid balances and spending
            across all client accounts.
          </p>
        </div>

        {/* <button
          type="button"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          {refreshing ? "Refreshing..." : "Refresh"}
        </button> */}
      </div>

      {/* ACCOUNT SUMMARY */}

      <section className="account-summary">

        <div className="account-summary-item">
          <span>Total Accounts</span>
          <h2>{counts.all}</h2>
        </div>

        <div className="account-summary-item healthy-summary">
          <span>Healthy</span>
          <h2>{counts.healthy}</h2>
        </div>

        <div className="account-summary-item low-summary">
          <span>Low Balance</span>
          <h2>{counts.low}</h2>
        </div>

        <div className="account-summary-item critical-summary">
          <span>Critical / Stopped</span>
          <h2>{counts.critical + counts.stopped}</h2>
        </div>

      </section>

      {/* FILTERS */}

      <div className="account-filters">
        {filters.map((filter) => (
          <button
            key={filter.value}
            type="button"
            className={`account-filter ${
              activeFilter === filter.value ? "active" : ""
            }`}
            onClick={() => setActiveFilter(filter.value)}
          >
            {filter.label}

            <span className="filter-count">
              {counts[filter.value]}
            </span>
          </button>
        ))}
      </div>

      {/* ACCOUNT SECTION HEADER */}

      <div className="account-section-heading">
        <div>
          <h2>All Ad Accounts</h2>
          <p>
            Showing {filteredAccounts.length} of {accounts.length} accounts
          </p>
        </div>

        {refreshing && (
          <span className="account-refreshing">
            Refreshing...
          </span>
        )}
      </div>

      {/* LOADING */}

      {loading && (
        <div className="account-empty">
          <h3>Loading ad accounts...</h3>
          <p>Please wait while we fetch account information.</p>
        </div>
      )}

      {/* API ERROR */}

      {!loading && error && (
        <div className="account-empty">
          <h3>Unable to load ad accounts</h3>
          <p>{error}</p>

          <button
  type="button"
  onClick={fetchAdAccounts}
  disabled={refreshing}
>
  {refreshing ? "Refreshing..." : "Try Again"}
</button>
        </div>
      )}

      {/* ACCOUNT CARDS */}

      {!loading && !error && (
        <section className="account-cards-grid">

          {filteredAccounts.map((account) => {
            const percentage =
              account.spend + account.balance > 0
                ? Math.min(
                    (account.spend /
                      (account.spend + account.balance)) * 100,
                    100
                  )
                : 0;

            return (
              <div className="account-card" key={account.id}>

                {/* Card Header */}

                <div className="account-card-header">
                  <div className="account-name-wrapper">
                    <span
                      className={`account-status-dot ${account.type}`}
                    />

                    <h3>{account.name}</h3>
                  </div>

                  <span
                    className={`account-status ${account.type}`}
                  >
                    {account.status}
                  </span>
                </div>

                {/* Balance */}

                <p className="account-balance-label">
                  Prepaid Balance
                </p>

                <h2 className="account-balance">
                  {money(account.balance)}
                </h2>

                {/* Progress */}

                <div className="account-progress">
                  <div
                    className={`account-progress-fill ${account.type}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>

                {/* Spending */}

                <div className="account-card-footer">
                  <span>Spent today</span>
                  <strong>{money(account.spend)}</strong>
                </div>

              </div>
            );
          })}

          {/* EMPTY STATE */}

          {filteredAccounts.length === 0 && (
            <div className="account-empty">
              <div className="account-empty-icon">⌕</div>

              <h3>No accounts found</h3>

              <p>
                No accounts match your search or selected filter.
              </p>

              <button
                type="button"
                onClick={() => {
                  setActiveFilter("all");
                  setSearch("");
                }}
              >
                Clear Filter
              </button>
            </div>
          )}

        </section>
      )}

    </div>
  );
}
