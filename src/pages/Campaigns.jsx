
import { useState, useEffect, useCallback, useMemo } from "react";
import "./Campaigns.css";

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"
).replace(/\/+$/, "");

const ITEMS_PER_PAGE = 5;

// Format currency without inventing missing values.
const formatCurrency = (value, currency = "INR") => {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  const number = Number(value);

  if (!Number.isFinite(number)) return "—";

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(number);
};

// Read a field from possible backend field names.
const getField = (record, fields) => {
  for (const field of fields) {
    if (
      record?.[field] !== undefined &&
      record?.[field] !== null &&
      record?.[field] !== ""
    ) {
      return record[field];
    }
  }

  return null;
};

// Convert backend status into a consistent display label.
const normalizeStatus = (status) => {
  if (!status) return "Unknown";

  const value = String(status).trim().toUpperCase();

  const statusMap = {
    ACTIVE: "Active",
    ENABLED: "Active",
    PAUSED: "Paused",
    DISABLED: "Paused",
    REJECTED: "Rejected",
    DISAPPROVED: "Rejected",
    STOPPED: "Stopped",
    DELETED: "Stopped",
    ARCHIVED: "Stopped",
    COMPLETED: "Stopped",
  };

  return statusMap[value] || value.charAt(0) + value.slice(1).toLowerCase();
};

const getStatusClass = (status) => {
  const value = String(status).toLowerCase();

  if (value === "active") return "active";
  if (value === "paused") return "paused";
  if (value === "rejected") return "rejected";
  if (value === "stopped") return "stopped";

  return "unknown";
};

// Map campaign API records to the table.
// Unknown values remain blank rather than being replaced with fake data.
const mapCampaign = (campaign, account) => {
  const rawStatus = getField(campaign, [
    "effectiveStatus",
    "effective_status",
    "status",
    "configuredStatus",
    "configured_status",
  ]);

  const budget = getField(campaign, [
    "dailyBudget",
    "daily_budget",
    "budget",
    "budgetAmount",
  ]);

  const spent = getField(campaign, [
    "spend",
    "amountSpent",
    "spent",
    "todaySpend",
    "spentToday",
  ]);

  const leads = getField(campaign, [
    "leads",
    "results",
    "totalLeads",
  ]);

  const cpl = getField(campaign, [
    "cpl",
    "costPerLead",
    "cost_per_lead",
    "cost_per_result",
  ]);

  const numericSpend =
    spent !== null && Number.isFinite(Number(spent))
      ? Number(spent)
      : null;

  const numericLeads =
    leads !== null && Number.isFinite(Number(leads))
      ? Number(leads)
      : null;

  const numericCpl =
    cpl !== null && Number.isFinite(Number(cpl))
      ? Number(cpl)
      : numericSpend !== null && numericLeads > 0
        ? numericSpend / numericLeads
        : null;

  const currency = account?.currency || campaign.currency || "INR";

  return {
    id: campaign.id || campaign.campaignId || campaign.metaCampaignId,
    name:
      getField(campaign, [
        "campaignName",
        "name",
        "campaign_name",
      ]) || "Unnamed campaign",
    account:
      account?.accountName ||
      campaign.accountName ||
      campaign.account ||
      "—",
    status: normalizeStatus(rawStatus),
    budget: formatCurrency(budget, currency),
    spent: formatCurrency(spent, currency),
    leads: leads === null ? "—" : Number(leads).toLocaleString("en-IN"),
    cpl: formatCurrency(numericCpl, currency),
  };
};

function Campaigns() {
  const [search, setSearch] = useState("");
  const [accounts, setAccounts] = useState([]);
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [campaigns, setCampaigns] = useState([]);

  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem("token");

    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }, []);

  // Fetch ad accounts from PostgreSQL.
  const fetchAccounts = useCallback(async () => {
    setLoadingAccounts(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/meta/accounts`, {
        method: "GET",
        headers: getAuthHeaders(),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to fetch ad accounts");
      }

      const accountList = Array.isArray(result.data) ? result.data : [];

      setAccounts(accountList);

      setSelectedAccountId((currentId) => {
        const accountExists = accountList.some(
          (account) =>
            String(account.metaAdAccountId) === String(currentId)
        );

        if (accountExists) return currentId;

        return accountList[0]?.metaAdAccountId
          ? String(accountList[0].metaAdAccountId)
          : "";
      });
    } catch (err) {
      setAccounts([]);
      setSelectedAccountId("");
      setCampaigns([]);
      setError(err.message || "Unable to fetch ad accounts");
    } finally {
      setLoadingAccounts(false);
    }
  }, [getAuthHeaders]);

  // Fetch campaigns for the selected Meta ad account.
  const fetchCampaigns = useCallback(
    async (accountId) => {
      if (!accountId) {
        setCampaigns([]);
        setLoadingCampaigns(false);
        setRefreshing(false);
        return;
      }

      setLoadingCampaigns(true);
      setError("");

      try {
        const url =
          `${API_BASE_URL}/api/meta/accounts/` +
          `${encodeURIComponent(accountId)}/campaigns`;

        const response = await fetch(url, {
          method: "GET",
          headers: getAuthHeaders(),
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || "Failed to fetch campaigns");
        }

        setCampaigns(Array.isArray(result.data) ? result.data : []);
        setCurrentPage(1);
      } catch (err) {
        setCampaigns([]);
        setError(err.message || "Unable to fetch campaigns");
      } finally {
        setLoadingCampaigns(false);
        setRefreshing(false);
      }
    },
    [getAuthHeaders]
  );

  // Load accounts when the page opens.
  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  // Load campaigns when the selected account changes.
  useEffect(() => {
    if (selectedAccountId) {
      fetchCampaigns(selectedAccountId);
    } else if (!loadingAccounts) {
      setCampaigns([]);
    }
  }, [selectedAccountId, loadingAccounts, fetchCampaigns]);

  // Listen to global Topbar search.
  useEffect(() => {
    const handleGlobalSearch = (event) => {
      setSearch(event.detail || "");
      setCurrentPage(1);
    };

    window.addEventListener("account-search", handleGlobalSearch);

    return () => {
      window.removeEventListener("account-search", handleGlobalSearch);
    };
  }, []);

  // Listen to global Topbar refresh.
  useEffect(() => {
    const handleGlobalRefresh = () => {
      if (loadingAccounts || loadingCampaigns) return;

      setRefreshing(true);

      if (selectedAccountId) {
        fetchCampaigns(selectedAccountId);
      } else {
        fetchAccounts();
        setRefreshing(false);
      }
    };

    window.addEventListener("dashboard-refresh", handleGlobalRefresh);

    return () => {
      window.removeEventListener("dashboard-refresh", handleGlobalRefresh);
    };
  }, [
    selectedAccountId,
    loadingAccounts,
    loadingCampaigns,
    fetchAccounts,
    fetchCampaigns,
  ]);

  const selectedAccount = useMemo(
    () =>
      accounts.find(
        (account) =>
          String(account.metaAdAccountId) === String(selectedAccountId)
      ),
    [accounts, selectedAccountId]
  );

  // Convert API campaign records for display.
  const displayCampaigns = useMemo(
    () =>
      campaigns.map((campaign) =>
        mapCampaign(campaign, selectedAccount)
      ),
    [campaigns, selectedAccount]
  );

  // Search campaigns by campaign name, account or status.
  const filteredCampaigns = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    if (!searchValue) return displayCampaigns;

    return displayCampaigns.filter((campaign) =>
      `${campaign.name} ${campaign.account} ${campaign.status}`
        .toLowerCase()
        .includes(searchValue)
    );
  }, [displayCampaigns, search]);

  // Campaign counts based on the selected account's API response.
  const activeCount = displayCampaigns.filter(
    (campaign) => campaign.status === "Active"
  ).length;

  const pausedCount = displayCampaigns.filter(
    (campaign) => campaign.status === "Paused"
  ).length;

  const rejectedCount = displayCampaigns.filter(
    (campaign) => campaign.status === "Rejected"
  ).length;

  const stoppedCount = displayCampaigns.filter(
    (campaign) => campaign.status === "Stopped"
  ).length;

  // Pagination.
  const totalPages = Math.ceil(
    filteredCampaigns.length / ITEMS_PER_PAGE
  );

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;

  const endIndex = Math.min(
    startIndex + ITEMS_PER_PAGE,
    filteredCampaigns.length
  );

  const paginatedCampaigns = filteredCampaigns.slice(
    startIndex,
    endIndex
  );

  const handlePreviousPage = () => {
    setCurrentPage((previous) => Math.max(previous - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((previous) =>
      Math.min(previous + 1, totalPages)
    );
  };

  const handleSearchChange = (event) => {
    setSearch(event.target.value);
    setCurrentPage(1);
  };

  return (
    <div className="campaigns-page">
      {/* PAGE HEADER */}
      <header className="campaigns-header">
        <div className="campaigns-title">
          <h1>Campaigns</h1>
          <p>Delivery status for the selected ad account.</p>
        </div>

        {refreshing && (
          <span className="campaigns-refreshing">
            Refreshing campaigns...
          </span>
        )}
      </header>

      {/* ACCOUNT FILTER */}
      <div className="campaigns-account-filter">
        <label htmlFor="campaign-account">Ad Account</label>

        <select
          id="campaign-account"
          value={selectedAccountId}
          onChange={(event) => {
            setSelectedAccountId(event.target.value);
            setCurrentPage(1);
          }}
          disabled={loadingAccounts || accounts.length === 0}
        >
          {loadingAccounts && (
            <option value="">Loading accounts...</option>
          )}

          {!loadingAccounts && accounts.length === 0 && (
            <option value="">No ad accounts available</option>
          )}

          {accounts.map((account) => (
            <option
              key={account.id}
              value={account.metaAdAccountId}
            >
              {account.accountName || account.metaAdAccountId}
            </option>
          ))}
        </select>
      </div>

      {/* API ERROR */}
      {error && (
        <div className="campaigns-error" role="alert">
          {error}
        </div>
      )}

      {/* SUMMARY CARDS */}
      <section className="campaigns-summary">
        <div className="campaign-summary active-summary">
          <p>Active</p>
          <h2>{loadingCampaigns ? "—" : activeCount}</h2>
          <span>Active campaigns</span>
        </div>

        <div className="campaign-summary paused-summary">
          <p>Paused</p>
          <h2>{loadingCampaigns ? "—" : pausedCount}</h2>
          <span>Paused campaigns</span>
        </div>

        <div className="campaign-summary rejected-summary">
          <p>Rejected</p>
          <h2>{loadingCampaigns ? "—" : rejectedCount}</h2>
          <span>Rejected campaigns</span>
        </div>

        <div className="campaign-summary stopped-summary">
          <p>Stopped</p>
          <h2>{loadingCampaigns ? "—" : stoppedCount}</h2>
          <span>Stopped campaigns</span>
        </div>
      </section>

      {/* CAMPAIGN SEARCH */}
      <div className="campaigns-search-section">
        <div className="campaigns-search-box">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <circle
              cx="11"
              cy="11"
              r="7"
              stroke="currentColor"
              strokeWidth="1.8"
            />
            <path
              d="m16 16 4 4"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>

          <input
            type="text"
            placeholder="Search by campaign name, account or status..."
            value={search}
            onChange={handleSearchChange}
            aria-label="Search campaigns"
          />

          {search && (
            <button
              type="button"
              className="campaigns-search-clear"
              onClick={() => {
                setSearch("");
                setCurrentPage(1);
              }}
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* CAMPAIGNS TABLE */}
      <section className="campaigns-table-panel">
        <div className="campaigns-table-header">
          <div>
            <h2>All Campaigns</h2>
            <p>
              Showing{" "}
              {filteredCampaigns.length === 0 ? 0 : startIndex + 1}
              –{endIndex} of {filteredCampaigns.length} campaigns
            </p>
          </div>

          <span className="campaigns-total">
            {filteredCampaigns.length} Campaigns
          </span>
        </div>

        <div className="campaigns-table-container">
          <table className="campaigns-table">
            <thead>
              <tr>
                <th>Campaign</th>
                <th>Account</th>
                <th>Status</th>
                <th>Budget / Day</th>
                <th>Spent Today</th>
                <th>Leads</th>
                <th>CPL</th>
              </tr>
            </thead>

            <tbody>
              {loadingAccounts || loadingCampaigns ? (
                <tr>
                  <td colSpan="7" className="campaigns-no-data">
                    <div>
                      <h3>Loading campaigns...</h3>
                      <p>Please wait while campaign data is fetched.</p>
                    </div>
                  </td>
                </tr>
              ) : paginatedCampaigns.length > 0 ? (
                paginatedCampaigns.map((campaign, index) => (
                  <tr key={campaign.id || `${campaign.name}-${index}`}>
                    <td className="campaign-name-cell">
                      {campaign.name}
                    </td>

                    <td>{campaign.account}</td>

                    <td>
                      <span
                        className={`campaign-status ${getStatusClass(
                          campaign.status
                        )}`}
                      >
                        {campaign.status}
                      </span>
                    </td>

                    <td>{campaign.budget}</td>
                    <td>{campaign.spent}</td>
                    <td>{campaign.leads}</td>
                    <td>{campaign.cpl}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="campaigns-no-data">
                    <div>
                      <h3>
                        {error
                          ? "Unable to load campaigns"
                          : search
                            ? "No campaigns found"
                            : "No campaigns available"}
                      </h3>
                      <p>
                        {search
                          ? "Try searching with another campaign name or status."
                          : "No campaign records were returned for this ad account."}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* MOBILE TABLE HINT */}
        <div className="campaigns-mobile-hint">
          ← Scroll horizontally to view all campaign details →
        </div>

        {/* PAGINATION */}
        {filteredCampaigns.length > 0 && (
          <div className="campaigns-pagination">
            <span className="pagination-info">
              Page {currentPage} of {totalPages}
            </span>

            <div className="pagination-controls">
              <button
                type="button"
                className="pagination-arrow"
                onClick={handlePreviousPage}
                disabled={currentPage === 1}
                aria-label="Previous page"
                title="Previous page"
              >
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="m15 18-6-6 6-6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>

              <span className="pagination-current-page">
                {currentPage}
              </span>

              <button
                type="button"
                className="pagination-arrow"
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                aria-label="Next page"
                title="Next page"
              >
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="m9 18 6-6-6-6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

export default Campaigns;
