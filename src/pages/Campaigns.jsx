
import { useState } from "react";
import "./Campaigns.css";

const campaigns = [
  {
    name: "Summer Offer – Leads",
    account: "NTQS Digital",
    status: "Active",
    budget: "₹1,500",
    spent: "₹1,180",
    leads: 142,
    cpl: "₹8",
  },
  {
    name: "Festive Sale",
    account: "Shootza",
    status: "Active",
    budget: "₹1,200",
    spent: "₹1,050",
    leads: 96,
    cpl: "₹11",
  },
  {
    name: "Lead Gen – Local",
    account: "Client A",
    status: "Paused",
    budget: "₹800",
    spent: "₹450",
    leads: 31,
    cpl: "₹15",
  },
  {
    name: "Brand Video",
    account: "Client B",
    status: "Stopped",
    budget: "₹1,000",
    spent: "₹0",
    leads: 0,
    cpl: "–",
  },
  {
    name: "Retarget Offer",
    account: "Client C",
    status: "Active",
    budget: "₹2,000",
    spent: "₹1,900",
    leads: 180,
    cpl: "₹11",
  },
  {
    name: "Carousel Promo",
    account: "Client D",
    status: "Rejected",
    budget: "₹900",
    spent: "₹0",
    leads: 0,
    cpl: "–",
  },
];

function Campaigns() {
  const [search, setSearch] = useState("");
  const [updated, setUpdated] = useState("11:35 AM");

  const filteredCampaigns = campaigns.filter((campaign) =>
    `${campaign.name} ${campaign.account}`
      .toLowerCase()
      .includes(search.toLowerCase())
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
    <div className="campaigns-page">

      {/* Header */}
      <header className="campaigns-header">
        <div className="campaigns-title">
          <h1>Campaigns</h1>
          <p>Delivery status across every client.</p>
        </div>

        <div className="campaigns-actions">
          <div className="campaigns-search">
            <span>⌕</span>
            <input
              type="text"
              placeholder="Search account..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="campaigns-updated">
            Updated {updated}
          </div>

          <button
            className="campaigns-refresh"
            onClick={handleRefresh}
          >
            Refresh
          </button>
        </div>
      </header>

      {/* Summary Cards */}
      <section className="campaigns-summary">

        <div className="campaign-summary active-summary">
          <p>Active</p>
          <h2>20</h2>
          <span>Delivering now</span>
        </div>

        <div className="campaign-summary paused-summary">
          <p>Paused</p>
          <h2>2</h2>
          <span>Check with client</span>
        </div>

        <div className="campaign-summary rejected-summary">
          <p>Rejected</p>
          <h2>2</h2>
          <span>Needs a new creative</span>
        </div>

        <div className="campaign-summary stopped-summary">
          <p>Stopped</p>
          <h2>1</h2>
          <span>Out of balance</span>
        </div>

      </section>

      {/* All Campaigns */}
      <section className="campaigns-table-panel">

        <h2>All campaigns</h2>

        <div className="campaigns-table-container">
          <table className="campaigns-table">
            <thead>
              <tr>
                <th>Campaign</th>
                <th>Account</th>
                <th>Status</th>
                <th>Budget / day</th>
                <th>Spent today</th>
                <th>Leads</th>
                <th>CPL</th>
              </tr>
            </thead>

            <tbody>
              {filteredCampaigns.map((campaign) => (
                <tr key={campaign.name}>
                  <td>{campaign.name}</td>
                  <td>{campaign.account}</td>

                  <td>
                    <span
                      className={`campaign-status ${campaign.status.toLowerCase()}`}
                    >
                      {campaign.status}
                    </span>
                  </td>

                  <td>{campaign.budget}</td>
                  <td>{campaign.spent}</td>
                  <td>{campaign.leads}</td>
                  <td>{campaign.cpl}</td>
                </tr>
              ))}

              {filteredCampaigns.length === 0 && (
                <tr>
                  <td colSpan="7" className="campaigns-no-data">
                    No campaigns found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </section>

    </div>
  );
}

export default Campaigns;
