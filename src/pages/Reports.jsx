
import { useState } from "react";
import "./Reports.css";

const initialExports = [
  {
    id: 1,
    name: "Monthly – Client C.pdf",
    date: "Nov 1",
  },
  {
    id: 2,
    name: "Weekly – All accounts.csv",
    date: "Nov 8",
  },
  {
    id: 3,
    name: "Balance history.pdf",
    date: "Nov 9",
  },
];

const reportCards = [
  {
    id: 1,
    category: "Weekly",
    title: "Spend and leads summary",
    type: "weekly",
  },
  {
    id: 2,
    category: "Monthly",
    title: "Client performance",
    type: "monthly",
  },
  {
    id: 3,
    category: "Balance",
    title: "Funds and alert history",
    type: "balance",
  },
];

function Reports() {
  const [search, setSearch] = useState("");
  const [updated, setUpdated] = useState("11:35 AM");
  const [exportsList] = useState(initialExports);

  const filteredExports = exportsList.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleRefresh = () => {
    setUpdated(
      new Date().toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      })
    );
  };

  const handleDownload = (fileName, format) => {
    const content = `NTQS Digital - ${fileName}\nReport generated from Meta Ads Monitoring.`;
    const blob = new Blob([content], {
      type: format === "CSV" ? "text/csv" : "application/pdf",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = fileName;
    link.click();

    URL.revokeObjectURL(url);
  };

  const handleReport = (report, format) => {
    const extension = format.toLowerCase();

    const fileName = `${report.title
      .toLowerCase()
      .replaceAll(" ", "-")}.${extension}`;

    handleDownload(fileName, format);
  };

  return (
    <div className="reports-page">

      {/* Header */}
      <header className="reports-header">

        <div className="reports-title">
          <h1>Reports</h1>
          <p>Export and schedule client reports.</p>
        </div>

        <div className="reports-actions">

          <div className="reports-search">
            <span>⌕</span>
            <input
              type="text"
              placeholder="Search account..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="reports-updated">
            Updated {updated}
          </div>

          <button
            className="reports-refresh"
            onClick={handleRefresh}
          >
            Refresh
          </button>

        </div>

      </header>

      {/* Report Cards */}
      <section className="reports-cards">

        {reportCards.map((report) => (
          <div
            className={`report-card ${report.type}`}
            key={report.id}
          >

            <p className="report-category">
              {report.category}
            </p>

            <h2>{report.title}</h2>

            <div className="report-buttons">
              <button
                onClick={() => handleReport(report, "PDF")}
              >
                PDF
              </button>

              <button
                onClick={() => handleReport(report, "CSV")}
              >
                CSV
              </button>
            </div>

          </div>
        ))}

      </section>

      {/* Recent Exports */}
      <section className="recent-exports">

        <h2>Recent exports</h2>

        <div className="exports-list">

          {filteredExports.map((item) => (
            <div className="export-row" key={item.id}>

              <span className="export-name">
                {item.name}
              </span>

              <span className="export-date">
                {item.date}
              </span>

              <button
                className="export-download"
                onClick={() =>
                  handleDownload(
                    item.name,
                    item.name.endsWith(".csv") ? "CSV" : "PDF"
                  )
                }
              >
                Download
              </button>

            </div>
          ))}

          {filteredExports.length === 0 && (
            <div className="exports-empty">
              No exports found.
            </div>
          )}

        </div>

      </section>

    </div>
  );
}

export default Reports;
