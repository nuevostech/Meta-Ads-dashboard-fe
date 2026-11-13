
import { useState } from "react";
import "./Performance.css";

const accountData = [
  { name: "NTQS", cpl: 82, color: "purple" },
  { name: "Shootza", cpl: 110, color: "purple" },
  { name: "Client C", cpl: 71, color: "purple" },
  { name: "Client A", cpl: 165, color: "orange" },
];

function Performance() {
  const [search, setSearch] = useState("");
  const [updated, setUpdated] = useState("11:35 AM");

  const filteredAccounts = accountData.filter((account) =>
    account.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleRefresh = () => {
    setUpdated(
      new Date().toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      })
    );
  };

  return (
    <div className="performance-page">

      {/* Header */}
      <header className="performance-header">
        <div className="performance-title">
          <h1>Performance</h1>
          <p>Spend, leads and CPL this month.</p>
        </div>

        <div className="performance-actions">
          <div className="performance-search">
            <span>⌕</span>
            <input
              type="text"
              placeholder="Search account..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="performance-updated">
            Updated {updated}
          </div>

          <button
            className="performance-refresh"
            onClick={handleRefresh}
          >
            Refresh
          </button>
        </div>
      </header>

      {/* Performance Summary */}
      <section className="performance-stats">

        <div className="performance-stat spend-stat">
          <p>Total spend</p>
          <h2>₹1,96,000</h2>
          <span>▲ 12% vs last month</span>
        </div>

        <div className="performance-stat">
          <p>Leads</p>
          <h2>1,482</h2>
          <span>▲ 18%</span>
        </div>

        <div className="performance-stat">
          <p>Avg. CPL</p>
          <h2>₹132</h2>
          <span>▼ 11%</span>
        </div>

        <div className="performance-stat">
          <p>CTR</p>
          <h2>2.4%</h2>
          <span>▲ 0.3 pts</span>
        </div>

      </section>

      {/* Performance Charts */}
      <section className="performance-charts">

        {/* Leads Over Time */}
        <div className="performance-panel leads-chart-panel">

          <div className="performance-panel-header">
            <h2>Leads over time</h2>
            <span className="chart-period">Past 30 days</span>
          </div>

          <div className="leads-chart">
            <svg
              viewBox="0 0 700 250"
              preserveAspectRatio="none"
            >
              <path
                d="M2 220 C90 218 120 195 190 165 S290 125 360 105 S490 72 550 48 S640 18 698 5"
                fill="none"
                stroke="#686bff"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </svg>
          </div>

        </div>

        {/* CPL by Account */}
        <div className="performance-panel cpl-panel">

          <h2>CPL by account</h2>

          <div className="cpl-list">

            {filteredAccounts.map((account) => (
              <div className="cpl-row" key={account.name}>

                <span className="cpl-name">
                  {account.name}
                </span>

                <div className="cpl-progress">
                  <div
                    className={`cpl-progress-fill ${account.color}`}
                    style={{
                      width: `${(account.cpl / 200) * 100}%`,
                    }}
                  />
                </div>

                <strong>₹{account.cpl}</strong>

              </div>
            ))}

          </div>

        </div>

      </section>

    </div>
  );
}

export default Performance;
