
import { useState } from "react";
import "./layout.css";

const getCurrentTime = () => {
  return new Date().toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const Topbar = () => {
  const [search, setSearch] = useState("");
  const [updatedTime, setUpdatedTime] = useState(getCurrentTime());

  const handleSearch = (value) => {
    setSearch(value);

    window.dispatchEvent(
      new CustomEvent("account-search", {
        detail: value,
      })
    );
  };

  const handleRefresh = () => {
    window.dispatchEvent(new Event("dashboard-refresh"));
    setUpdatedTime(getCurrentTime());
  };

  return (
    <header className="admin-topbar">

      <div className="topbar-left">
        <h2>Meta Ads Monitoring</h2>
        <p>All client ad accounts in one place.</p>
      </div>

      <div className="topbar-actions">

        {/* Search Account */}
        {/* <div className="topbar-search">
          <span className="search-icon">⌕</span>

          <input
            type="text"
            placeholder="Search account..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div> */}

        {/* Updated Time */}
        <div className="topbar-updated">
          <span className="updated-dot"></span>
          Updated {updatedTime}
        </div>

        {/* Refresh */}
        <button
          type="button"
          className="topbar-refresh"
          onClick={handleRefresh}
        >
          <span>↻</span>
          Refresh
        </button>

      </div>

    </header>
  );
};

export default Topbar;
