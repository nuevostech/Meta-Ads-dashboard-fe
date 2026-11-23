
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import "./Performance.css";

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"
).replace(/\/+$/, "");

const DATE_PRESETS = [
  { label: "Yesterday", value: "yesterday" },
  { label: "Last 7 Days", value: "last_7d" },
  { label: "Last 30 Days", value: "last_30d" },
];

// Safely convert numeric API values.
const toNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

// Read possible field names without assuming one database naming convention.
const getMetric = (record, possibleKeys) => {
  for (const key of possibleKeys) {
    if (record?.[key] !== undefined && record?.[key] !== null) {
      return toNumber(record[key]);
    }
  }

  return 0;
};

const formatCurrency = (value, currency = "INR") =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);

const formatDate = (dateValue) => {
  if (!dateValue) return "";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return String(dateValue);
  }

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
};

function Performance() {
  const [search, setSearch] = useState("");
  const [accounts, setAccounts] = useState([]);
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [datePreset, setDatePreset] = useState("last_30d");

  const [insights, setInsights] = useState([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

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
        const stillExists = accountList.some(
          (account) =>
            String(account.metaAdAccountId) === String(currentId)
        );

        if (stillExists) return currentId;

        return accountList[0]?.metaAdAccountId
          ? String(accountList[0].metaAdAccountId)
          : "";
      });
    } catch (err) {
      setAccounts([]);
      setSelectedAccountId("");
      setError(err.message || "Unable to load ad accounts");
    } finally {
      setLoadingAccounts(false);
    }
  }, [getAuthHeaders]);

  // Fetch insights for the selected account and date range.
  const fetchInsights = useCallback(
    async (accountId, preset = datePreset) => {
      if (!accountId) {
        setInsights([]);
        return;
      }

      setLoadingInsights(true);
      setError("");

      try {
        const url =
          `${API_BASE_URL}/api/meta/accounts/` +
          `${encodeURIComponent(accountId)}/insights` +
          `?date_preset=${encodeURIComponent(preset)}`;

        const response = await fetch(url, {
          method: "GET",
          headers: getAuthHeaders(),
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || "Failed to fetch insights");
        }

        setInsights(Array.isArray(result.data) ? result.data : []);
      } catch (err) {
        setInsights([]);
        setError(err.message || "Unable to load performance insights");
      } finally {
        setLoadingInsights(false);
        setRefreshing(false);
      }
    },
    [datePreset, getAuthHeaders]
  );

  // Initial account loading.
  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  // Load insights when account or date range changes.
  useEffect(() => {
    if (!selectedAccountId) {
      setInsights([]);
      return;
    }

    fetchInsights(selectedAccountId, datePreset);
  }, [selectedAccountId, datePreset, fetchInsights]);

  // Global Topbar search.
  useEffect(() => {
    const handleSearch = (event) => {
      setSearch(event.detail || "");
    };

    window.addEventListener("account-search", handleSearch);

    return () => {
      window.removeEventListener("account-search", handleSearch);
    };
  }, []);

  // Global Topbar refresh.
useEffect(() => {
  const handleRefresh = async () => {
    setRefreshing(true);

    if (selectedAccountId) {
      await fetchInsights(selectedAccountId, datePreset);
    } else {
      await fetchAccounts();
      setRefreshing(false);
    }
  };

    window.addEventListener("dashboard-refresh", handleRefresh);

    return () => {
      window.removeEventListener("dashboard-refresh", handleRefresh);
    };
  }, [
    selectedAccountId,
    datePreset,
    loadingAccounts,
    loadingInsights,
    refreshing,
    fetchAccounts,
    fetchInsights,
  ]);

  // Filter accounts using global search.
  const filteredAccounts = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    if (!searchValue) return accounts;

    return accounts.filter((account) =>
      [
        account.accountName,
        account.metaAdAccountId,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value).toLowerCase().includes(searchValue)
        )
    );
  }, [accounts, search]);

  const selectedAccount = useMemo(
    () =>
      accounts.find(
        (account) =>
          String(account.metaAdAccountId) === String(selectedAccountId)
      ),
    [accounts, selectedAccountId]
  );

  // Calculate summary metrics from actual API data.
  const summary = useMemo(() => {
    const totalSpend = insights.reduce(
      (total, item) =>
        total +
        getMetric(item, ["spend", "amountSpent", "totalSpend"]),
      0
    );

    const totalLeads = insights.reduce(
      (total, item) =>
        total +
        getMetric(item, ["leads", "results", "totalLeads"]),
      0
    );

    const totalImpressions = insights.reduce(
      (total, item) =>
        total +
        getMetric(item, ["impressions", "totalImpressions"]),
      0
    );

    const totalClicks = insights.reduce(
      (total, item) =>
        total +
        getMetric(item, ["clicks", "linkClicks", "totalClicks"]),
      0
    );

    const avgCpl = totalLeads > 0 ? totalSpend / totalLeads : 0;

    const ctr =
      totalImpressions > 0
        ? (totalClicks / totalImpressions) * 100
        : 0;

    return {
      totalSpend,
      totalLeads,
      avgCpl,
      ctr,
    };
  }, [insights]);

  // Build leads trend from actual daily insight records.
  const leadsTrend = useMemo(() => {
    const dailyData = insights
      .map((item) => ({
        date: item.date,
        leads: getMetric(item, ["leads", "results", "totalLeads"]),
      }))
      .filter((item) => item.date);

    dailyData.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    return dailyData.map((item) => ({
      day: formatDate(item.date),
      leads: item.leads,
    }));
  }, [insights]);

  // Calculate CPL for the selected account.
  const cplData = useMemo(() => {
    if (!selectedAccount || insights.length === 0) return [];

    return [
      {
        name: selectedAccount.accountName || "Selected account",
        cpl: summary.avgCpl,
      },
    ];
  }, [selectedAccount, insights, summary.avgCpl]);

  const currency = selectedAccount?.currency || "INR";

  return (
    <div className="performance-page">
      {/* PAGE HEADER */}
      <div className="performance-header">
        <div>
          <h1>Performance</h1>
          <p>Spend, leads and CPL for your selected ad account.</p>
        </div>
      </div>

      {/* ACCOUNT AND DATE FILTERS */}
      <div className="performance-filters">
        <div className="performance-filter">
          <label htmlFor="performance-account">Ad Account</label>

          <select
            id="performance-account"
            value={selectedAccountId}
            onChange={(event) => setSelectedAccountId(event.target.value)}
            disabled={loadingAccounts || accounts.length === 0}
          >
            {loadingAccounts && <option value="">Loading accounts...</option>}

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

        <div className="performance-filter">
          <label htmlFor="performance-date">Date Range</label>

          <select
            id="performance-date"
            value={datePreset}
            onChange={(event) => setDatePreset(event.target.value)}
          >
            {DATE_PRESETS.map((preset) => (
              <option key={preset.value} value={preset.value}>
                {preset.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ERROR MESSAGE */}
      {error && (
        <div className="performance-error" role="alert">
          {error}
        </div>
      )}

      {/* PERFORMANCE SUMMARY */}
      <section className="performance-stats">
        <div className="performance-stat spend-stat">
          <p>Total spend</p>
          <h2>
            {loadingInsights ? "Loading..." : formatCurrency(summary.totalSpend, currency)}
          </h2>
          <span>Selected reporting period</span>
        </div>

        <div className="performance-stat">
          <p>Leads</p>
          <h2>
            {loadingInsights ? "Loading..." : summary.totalLeads.toLocaleString("en-IN")}
          </h2>
          <span>Selected reporting period</span>
        </div>

        <div className="performance-stat">
          <p>Avg. CPL</p>
          <h2>
            {loadingInsights ? "Loading..." : formatCurrency(summary.avgCpl, currency)}
          </h2>
          <span>Spend divided by leads</span>
        </div>

        <div className="performance-stat">
          <p>CTR</p>
          <h2>
            {loadingInsights ? "Loading..." : `${summary.ctr.toFixed(2)}%`}
          </h2>
          <span>Clicks divided by impressions</span>
        </div>
      </section>

      {/* PERFORMANCE CHARTS */}
      <section className="performance-charts">
        {/* LEADS OVER TIME */}
        <div className="performance-panel leads-chart-panel">
          <div className="performance-panel-header">
            <div>
              <h2>Leads over time</h2>
              <p className="performance-panel-subtitle">
                Daily lead generation trend
              </p>
            </div>

            <span className="chart-period">
              {DATE_PRESETS.find((item) => item.value === datePreset)?.label}
            </span>
          </div>

          <div
            className="leads-chart"
            role="img"
            aria-label="Daily leads based on the selected account insights"
          >
            {loadingInsights ? (
              <div className="performance-chart-message">
                Loading performance data...
              </div>
            ) : leadsTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={leadsTrend}
                  margin={{ top: 6, right: 10, bottom: 0, left: 0 }}
                  accessibilityLayer
                >
                  <CartesianGrid
                    stroke="#242e55"
                    strokeDasharray="3 3"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="day"
                    tick={{ fill: "#8995bd", fontSize: 9 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    width={35}
                    tick={{ fill: "#8995bd", fontSize: 9 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#121a3b",
                      border: "1px solid #26345f",
                      borderRadius: 8,
                      fontSize: 11,
                    }}
                    formatter={(value) => [value, "Leads"]}
                    labelFormatter={(day) => day}
                  />
                  <Area
                    type="monotone"
                    dataKey="leads"
                    stroke="#686bff"
                    strokeWidth={3}
                    fill="#686bff"
                    fillOpacity={0.18}
                    activeDot={{ r: 4 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="performance-chart-message">
                No daily lead data available for this period.
              </div>
            )}
          </div>

          {refreshing && (
            <p className="performance-refresh-status">
              Refreshing performance data...
            </p>
          )}
        </div>

        {/* CPL BY ACCOUNT */}
        <div className="performance-panel cpl-panel">
          <div className="performance-panel-header">
            <div>
              <h2>CPL by account</h2>
              <p className="performance-panel-subtitle">
                Cost per lead for the selected account
              </p>
            </div>
          </div>

          <div className="cpl-chart">
            {loadingInsights ? (
              <div className="cpl-empty">Loading CPL data...</div>
            ) : cplData.length > 0 ? (
              <div
                className="cpl-chart-canvas"
                role="img"
                aria-label="Cost per lead for the selected account"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={cplData}
                    layout="vertical"
                    margin={{ top: 4, right: 28, bottom: 0, left: 0 }}
                    barSize={13}
                  >
                    <CartesianGrid
                      stroke="#242e55"
                      strokeDasharray="3 3"
                      horizontal={false}
                    />
                    <XAxis
                      type="number"
                      tick={{ fill: "#8995bd", fontSize: 9 }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `₹${value}`}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={90}
                      tick={{ fill: "#e7e9f8", fontSize: 10 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "#121a3b",
                        border: "1px solid #26345f",
                        borderRadius: 8,
                        fontSize: 11,
                      }}
                      formatter={(value) => [
                        formatCurrency(value, currency),
                        "CPL",
                      ]}
                    />
                    <Bar dataKey="cpl" fill="#686bff" radius={[0, 4, 4, 0]}>
                      <Cell fill="#686bff" />
                      <LabelList
                        dataKey="cpl"
                        position="right"
                        formatter={(value) => formatCurrency(value, currency)}
                        fill="#e7e9f8"
                        fontSize={8}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="cpl-empty">
                No CPL data available for this account and period.
              </div>
            )}
          </div>

          <div className="cpl-footer">
            <span>Calculated from actual spend and leads</span>
            <span>{selectedAccount?.accountName || "No account selected"}</span>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Performance;
