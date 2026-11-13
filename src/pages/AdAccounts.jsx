
import { useState } from "react";
import "./AdAccounts.css";

const initialAccounts = [
  {
    id: 1,
    name: "NTQS Digital",
    balance: 8500,
    spend: 3200,
    status: "Healthy",
    type: "healthy",
  },
  {
    id: 2,
    name: "Shootza",
    balance: 1200,
    spend: 1050,
    status: "Low Balance",
    type: "low",
  },
  {
    id: 3,
    name: "Client A",
    balance: 450,
    spend: 450,
    status: "Critical",
    type: "critical",
  },
  {
    id: 4,
    name: "Client B",
    balance: 0,
    spend: 0,
    status: "Ads Stopped",
    type: "stopped",
  },
  {
    id: 5,
    name: "Client C",
    balance: 5900,
    spend: 2300,
    status: "Healthy",
    type: "healthy",
  },
  {
    id: 6,
    name: "Client D",
    balance: 2400,
    spend: 900,
    status: "Healthy",
    type: "healthy",
  },
  {
    id: 7,
    name: "Client E",
    balance: 780,
    spend: 620,
    status: "Low Balance",
    type: "low",
  },
];

const filters = [
  { label: "All", value: "all" },
  { label: "Healthy", value: "healthy" },
  { label: "Low balance", value: "low" },
  { label: "Critical", value: "critical" },
  { label: "Stopped", value: "stopped" },
];

const money = (value) =>
  `₹${value.toLocaleString("en-IN")}`;

export default function AdAccounts() {
  const [accounts, setAccounts] = useState(initialAccounts);
  const [activeFilter, setActiveFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [updated, setUpdated] = useState("11:35 AM");
  const [refreshing, setRefreshing] = useState(false);

  const counts = {
    all: accounts.length,
    healthy: accounts.filter((a) => a.type === "healthy").length,
    low: accounts.filter((a) => a.type === "low").length,
    critical: accounts.filter((a) => a.type === "critical").length,
    stopped: accounts.filter((a) => a.type === "stopped").length,
  };

  const filteredAccounts = accounts.filter((account) => {
    const matchesFilter =
      activeFilter === "all" || account.type === activeFilter;

    const matchesSearch = account.name
      .toLowerCase()
      .includes(search.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const handleRefresh = () => {
    setRefreshing(true);

    // Replace this sample refresh with your API call.
    setUpdated(
      new Date().toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      })
    );

    setTimeout(() => setRefreshing(false), 500);
  };

  return (
    <div className="ad-accounts-page">

      {/* Header */}
      <header className="ad-accounts-header">
        <div>
          <h1>Ad accounts</h1>
          <p>Prepaid balances refresh every 15 minutes.</p>
        </div>

        <div className="ad-accounts-actions">

          <div className="ad-account-search">
            <span>⌕</span>
            <input
              type="text"
              placeholder="Search account..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <span className="ad-account-updated">
            Updated {updated}
          </span>

          <button
            className="ad-account-refresh"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>

        </div>
      </header>

      {/* Filters */}
      <div className="account-filters">
        {filters.map((filter) => (
          <button
            key={filter.value}
            className={`account-filter ${
              activeFilter === filter.value ? "active" : ""
            }`}
            onClick={() => setActiveFilter(filter.value)}
          >
            {filter.label} {counts[filter.value]}
          </button>
        ))}
      </div>

      {/* Account Cards */}
      <section className="account-cards-grid">

        {filteredAccounts.map((account) => {
          const percentage =
            account.spend + account.balance > 0
              ? Math.min(
                  (account.spend /
                    (account.spend + account.balance)) *
                    100,
                  100
                )
              : 0;

          return (
            <div className="account-card" key={account.id}>

              <div className="account-card-header">
                <h3>{account.name}</h3>

                <span className={`account-status ${account.type}`}>
                  {account.status}
                </span>
              </div>

              <p className="account-balance-label">
                Prepaid balance
              </p>

              <h2 className="account-balance">
                {money(account.balance)}
              </h2>

              <div className="account-progress">
                <div
                  className={`account-progress-fill ${account.type}`}
                  style={{ width: `${percentage}%` }}
                />
              </div>

              <p className="account-spend">
                Spent today {money(account.spend)}
              </p>

            </div>
          );
        })}

        {filteredAccounts.length === 0 && (
          <div className="account-empty">
            <h3>No accounts found</h3>
            <p>Try changing your search or status filter.</p>
          </div>
        )}

      </section>

    </div>
  );
}
