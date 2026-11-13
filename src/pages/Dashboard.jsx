import { useState } from "react";
import "./Dashboard.css";

const accounts = [
  {
    name: "NTQS Digital",
    balance: "₹8,500",
    spend: "₹3,200",
    status: "Healthy",
    type: "healthy",
  },
  {
    name: "Shootza",
    balance: "₹1,200",
    spend: "₹1,050",
    status: "Low Balance",
    type: "low",
  },
  {
    name: "Client A",
    balance: "₹450",
    spend: "₹450",
    status: "Critical",
    type: "critical",
  },
  {
    name: "Client B",
    balance: "₹0",
    spend: "₹0",
    status: "Ads Stopped",
    type: "stopped",
  },
  {
    name: "Client C",
    balance: "₹5,900",
    spend: "₹2,300",
    status: "Healthy",
    type: "healthy",
  },
];

const alerts = [
  {
    type: "pink",
    title: "Client B – Ads stopped",
    description: "Balance is ₹0. Add funds to resume ads.",
  },
  {
    type: "orange",
    title: "Client A – Critical balance",
    description: "Balance ₹450, below the ₹500 limit.",
  },
  {
    type: "yellow",
    title: "Shootza – Low balance",
    description: "Balance ₹1,200, below ₹2,000.",
  },
];

export default function Dashboard() {
  const [search, setSearch] = useState("");
  const [updated, setUpdated] = useState("11:35 AM");
  const [loading, setLoading] = useState(false);

  const filteredAccounts = accounts.filter((account) =>
    account.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleRefresh = () => {
    setLoading(true);

    setUpdated(
      new Date().toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      })
    );

    setTimeout(() => setLoading(false), 500);
  };

  return (
    <div className="dashboard-page">

      {/* Dashboard Header */}
      <header className="dashboard-header">
        <div className="dashboard-heading">
          <h1>Meta Ads Monitoring</h1>
          <p>All client ad accounts in one place.</p>
        </div>

        <div className="dashboard-header-actions">

          <div className="dashboard-search">
            <span>⌕</span>

            <input
              type="text"
              placeholder="Search account..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="dashboard-updated">
            Updated {updated}
          </div>

          <button
            className="dashboard-refresh"
            onClick={handleRefresh}
            disabled={loading}
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>

        </div>
      </header>

      {/* Summary Cards */}
      <section className="dashboard-stats">

        <div className="stat-card">
          <div className="stat-icon purple">▤</div>
          <div>
            <h2>12</h2>
            <p>Ad accounts</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon slate">◁</div>
          <div>
            <h2>28</h2>
            <p>Active campaigns</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon gold">⚠</div>
          <div>
            <h2>3</h2>
            <p>Low balance</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon coral">⊘</div>
          <div>
            <h2>1</h2>
            <p>Ads stopped</p>
          </div>
        </div>

      </section>

      {/* Accounts and Alerts */}
      <section className="dashboard-middle">

        {/* Ad Accounts */}
        <div className="dashboard-panel accounts-panel">

          <div className="panel-header">
            <h2>Ad accounts</h2>
            <button>View all ›</button>
          </div>

          <div className="table-wrapper">
            <table className="accounts-table">

              <thead>
                <tr>
                  <th>Account</th>
                  <th>Balance</th>
                  <th>Today's spend</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {filteredAccounts.map((account) => (
                  <tr key={account.name}>
                    <td>{account.name}</td>
                    <td>{account.balance}</td>
                    <td>{account.spend}</td>
                    <td>
                      <span className={`account-badge ${account.type}`}>
                        {account.status}
                      </span>
                    </td>
                  </tr>
                ))}

                {filteredAccounts.length === 0 && (
                  <tr>
                    <td colSpan="4" className="no-accounts">
                      No matching accounts found.
                    </td>
                  </tr>
                )}
              </tbody>

            </table>
          </div>

        </div>

        {/* Alerts */}
        <div className="dashboard-panel alerts-panel">

          <div className="panel-header">
            <h2>Alerts</h2>
            <button>View all ›</button>
          </div>

          <div className="alerts-list">

            {alerts.map((alert) => (
              <div className="alert-item" key={alert.title}>

                <div className={`alert-circle ${alert.type}`}>
                  !
                </div>

                <div className="alert-content">
                  <h3>{alert.title}</h3>
                  <p>{alert.description}</p>
                </div>

              </div>
            ))}

          </div>

        </div>

      </section>

      {/* Performance Cards */}
      <section className="dashboard-bottom">

        {/* Monthly Spend */}
        <div className="dashboard-panel spend-panel">

          <p className="metric-title">Monthly ad spend</p>

          <h2>₹1,96,000</h2>

          <span className="spend-trend">
            ▲ 12% vs last month
          </span>

          <svg
            className="spend-chart"
            viewBox="0 0 420 112"
            preserveAspectRatio="none"
          >
            <path
              d="M2 99 C42 98 66 87 94 76 S150 61 190 51 S256 34 302 22 S365 5 418 0"
              fill="none"
              stroke="#ffffff"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>

        </div>

        {/* Leads */}
        <div className="dashboard-panel leads-panel">

          <p className="metric-title">
            Leads and cost per lead
          </p>

          <div className="leads-container">

            <div>
              <h2>1,482</h2>
              <span className="leads-badge">
                ▲ 18% leads
              </span>
            </div>

            <div>
              <h2>₹132</h2>
              <span className="leads-badge">
                ▼ 11% CPL
              </span>
            </div>

          </div>

        </div>

        {/* Campaign Status */}
        <div className="dashboard-panel campaign-panel">

          <p className="metric-title">
            Campaign status
          </p>

          <div className="campaign-progress">
            <span className="active-progress"></span>
            <span className="paused-progress"></span>
            <span className="rejected-progress"></span>
            <span className="other-progress"></span>
          </div>

          <div className="campaign-item">
            <span>Active</span>
            <strong>20</strong>
          </div>

          <div className="campaign-item">
            <span>Paused</span>
            <strong>2</strong>
          </div>

          <div className="campaign-item">
            <span>Rejected</span>
            <strong>2</strong>
          </div>

        </div>

      </section>

    </div>
  );
}