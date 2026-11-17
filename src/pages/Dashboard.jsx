
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import "./Dashboard.css";

const API_URL = "http://localhost:5000/api/dashboard";

const formatCurrency = (value, currency = "INR") => {
  const amount = Number(value || 0);

  if (currency === "INR") {
    return `₹${amount.toLocaleString("en-IN", {
      maximumFractionDigits: 2,
    })}`;
  }

  return `${currency || "INR"} ${amount.toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;
};

const getBalanceClass = (status) => {
  switch (status) {
    case "Healthy":
      return "healthy";
    case "Low Balance":
      return "low";
    case "Critical":
      return "critical";
    case "Urgent":
      return "stopped";
    default:
      return "";
  }
};

export default function Dashboard() {
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch dashboard data
  const fetchDashboard = useCallback(async () => {
    try {
      setError("");

      const token =
        localStorage.getItem("token") ||
        sessionStorage.getItem("token");

      if (!token) {
        throw new Error("Please log in to access the dashboard.");
      }

      const response = await fetch(API_URL, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to load dashboard data."
        );
      }

      if (!data.success) {
        throw new Error(data.message || "Dashboard request failed.");
      }

      setDashboardData(data);
    } catch (err) {
      setError(err.message || "Unable to load dashboard.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial loading
  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // Global search
  useEffect(() => {
    const handleSearch = (event) => {
      setSearch(event.detail || "");
    };

    window.addEventListener("account-search", handleSearch);

    return () => {
      window.removeEventListener("account-search", handleSearch);
    };
  }, []);

  // Refresh dashboard
  const handleRefresh = useCallback(() => {
    if (refreshing) return;

    setRefreshing(true);
    fetchDashboard();
  }, [refreshing, fetchDashboard]);

  useEffect(() => {
    window.addEventListener("dashboard-refresh", handleRefresh);

    return () => {
      window.removeEventListener("dashboard-refresh", handleRefresh);
    };
  }, [handleRefresh]);

  // Actual backend response
  const summary = dashboardData?.summary || {};
  const accounts = dashboardData?.accounts || [];
  const lowBalanceAccounts = dashboardData?.lowBalanceAccounts || [];

  // Filter accounts
  const filteredAccounts = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) return accounts;

    return accounts.filter((account) =>
      (account.accountName || "").toLowerCase().includes(value)
    );
  }, [search, accounts]);

  // Dashboard navigation
  const handleViewAccounts = () => {
    navigate("/ad-accounts");
  };

  const handleViewAlerts = () => {
    navigate("/alerts");
  };

  // Loading
  if (loading) {
    return (
      <div className="dashboard-page">
        <p className="dashboard-refresh-status">
          Loading dashboard data...
        </p>
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-error">
          <p>{error}</p>
          <button type="button" onClick={fetchDashboard}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">

      {/* PAGE HEADER */}
      <div className="dashboard-header">
        <div>
          <h1>Dashboard</h1>
          <p>
            Overview of all client ad accounts and performance.
          </p>
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <section className="dashboard-stats">

        <div className="stat-card">
          <div className="stat-icon purple">▤</div>
          <div>
            <h2>{summary.totalAccounts ?? 0}</h2>
            <p>Ad accounts</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon slate">◁</div>
          <div>
            <h2>{summary.totalActiveCampaigns ?? 0}</h2>
            <p>Active campaigns</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon gold">⚠</div>
          <div>
            <h2>{summary.lowBalanceCount ?? 0}</h2>
            <p>Low balance</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon coral">⊘</div>
          <div>
            <h2>{summary.urgentBalanceCount ?? 0}</h2>
            <p>Urgent balance</p>
          </div>
        </div>

      </section>

      {/* ACCOUNTS AND ALERTS */}
      <section className="dashboard-middle">

        {/* AD ACCOUNTS */}
        <div className="dashboard-panel accounts-panel">

          <div className="panel-header">
            <div>
              <h2>Ad accounts</h2>
              <p className="panel-subtitle">
                Overview of your client accounts
              </p>
            </div>

            <button
              type="button"
              onClick={handleViewAccounts}
              className="panel-view-button"
            >
              View all ›
            </button>
          </div>

          <div className="table-wrapper">
            <table className="accounts-table">
              <thead>
                <tr>
                  <th>Account</th>
                  <th>Balance</th>
                  <th>Total spend</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {filteredAccounts.map((account) => (
                  <tr key={account.id}>
                    <td className="account-name">
                      {account.accountName}
                    </td>

                    <td>
                      {account.availableBalance !== null
                        ? formatCurrency(
                            account.availableBalance,
                            account.currency
                          )
                        : "Unknown"}
                    </td>

                    <td>
                      {formatCurrency(
                        account.totalSpend,
                        account.currency
                      )}
                    </td>

                    <td>
                      <span
                        className={`account-badge ${getBalanceClass(
                          account.balanceStatus
                        )}`}
                      >
                        {account.balanceStatus}
                      </span>
                    </td>
                  </tr>
                ))}

                {filteredAccounts.length === 0 && (
                  <tr>
                    <td colSpan="4" className="no-accounts">
                      {search
                        ? "No matching accounts found."
                        : "No ad accounts available."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {refreshing && (
            <p className="dashboard-refresh-status">
              Refreshing dashboard...
            </p>
          )}

        </div>

        {/* LOW BALANCE ALERTS */}
        <div className="dashboard-panel alerts-panel">

          <div className="panel-header">
            <div>
              <h2>Alerts</h2>
              <p className="panel-subtitle">
                Accounts that need attention
              </p>
            </div>

            <button
              type="button"
              onClick={handleViewAlerts}
              className="panel-view-button"
            >
              View all ›
            </button>
          </div>

          <div className="alerts-list">

            {lowBalanceAccounts.map((account) => (
              <div className="alert-item" key={account.id}>

                <div
                  className={`alert-circle ${
                    account.balanceStatus === "Urgent"
                      ? "pink"
                      : account.balanceStatus === "Critical"
                      ? "orange"
                      : "yellow"
                  }`}
                >
                  !
                </div>

                <div className="alert-content">
                  <h3>
                    {account.accountName} – {account.balanceStatus}
                  </h3>

                  <p>
                    Available balance:{" "}
                    {account.availableBalance !== null
                      ? formatCurrency(
                          account.availableBalance,
                          account.currency
                        )
                      : "Unknown"}
                  </p>
                </div>

              </div>
            ))}

            {lowBalanceAccounts.length === 0 && (
              <p>No low-balance accounts currently.</p>
            )}

          </div>

        </div>

      </section>

      {/* PERFORMANCE CARDS */}
      <section className="dashboard-bottom">

        {/* TOTAL SPEND */}
        <div className="dashboard-panel spend-panel">

          <p className="metric-title">
            Total ad spend
          </p>

          <h2>
            {formatCurrency(summary.totalSpend)}
          </h2>

          <p className="panel-subtitle">
            Reporting period: {dashboardData?.dateRange?.startDate || "—"}
            {" "}to{" "}
            {dashboardData?.dateRange?.endDate || "—"}
          </p>

          <div className="spend-chart">
            <p className="panel-subtitle">
              Historical monthly spend is not yet provided by this API.
            </p>
          </div>

        </div>

        {/* LEADS */}
        <div className="dashboard-panel leads-panel">

          <p className="metric-title">
            Leads and cost per lead
          </p>

          <div className="leads-container">

            <div className="lead-metric">
              <h2>
                {Number(summary.totalLeads || 0).toLocaleString("en-IN")}
              </h2>
              <span className="leads-badge">
                Leads
              </span>
            </div>

            <div className="lead-metric">
              <h2>
                {formatCurrency(summary.averageCPL)}
              </h2>
              <span className="leads-badge">
                Average CPL
              </span>
            </div>

          </div>

        </div>

        {/* CAMPAIGN STATUS */}
        <div className="dashboard-panel campaign-panel">

          <p className="metric-title">
            Campaign status
          </p>

          <div className="campaign-item">
            <span>
              <i className="campaign-dot active-dot"></i>
              Active
            </span>
            <strong>{summary.totalActiveCampaigns ?? 0}</strong>
          </div>

          <p className="panel-subtitle">
            Only active campaign counts are currently returned by the backend.
            Paused and rejected campaign counts are not available yet.
          </p>

        </div>

      </section>

    </div>
  );
}
