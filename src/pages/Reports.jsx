
import { useCallback, useEffect, useMemo, useState } from "react";
import "./Reports.css";

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"
).replace(/\/+$/, "");

const API_URL = `${API_BASE_URL}/api/reports`;

const reportCards = [
  {
    id: 1,
    category: "Weekly",
    title: "Spend and leads summary",
    type: "account_performance",
  },
  {
    id: 2,
    category: "Monthly",
    title: "Client performance",
    type: "client_performance",
  },
  {
    id: 3,
    category: "Balance",
    title: "Funds and alert history",
    type: "balance_report",
  },
  {
    id: 4,
    category: "Campaign",
    title: "Campaign performance",
    type: "campaign_performance",
  },
];

// =====================================
// AUTHENTICATION
// =====================================

const getToken = () =>
  localStorage.getItem("token") ||
  sessionStorage.getItem("token");

// =====================================
// FORMAT DATE
// =====================================

const formatDate = (dateValue) => {
  if (!dateValue) return "Date unavailable";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return date.toLocaleDateString("en-IN", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

// =====================================
// FORMAT FILE NAME
// =====================================

const getFileName = (contentDisposition, fallback) => {
  if (!contentDisposition) return fallback;

  const utfMatch = contentDisposition.match(
    /filename\*=UTF-8''([^;]+)/i
  );

  if (utfMatch) {
    return decodeURIComponent(utfMatch[1]);
  }

  const normalMatch = contentDisposition.match(
    /filename="?([^"]+)"?/i
  );

  return normalMatch ? normalMatch[1] : fallback;
};

// =====================================
// DOWNLOAD BLOB
// =====================================

const downloadBlob = (blob, fileName) => {
  const url = window.URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  window.URL.revokeObjectURL(url);
};

// =====================================
// READ API ERROR
// =====================================

const getResponseError = async (response) => {
  try {
    const data = await response.json();
    return data.message || "Something went wrong.";
  } catch {
    return "Something went wrong while processing the request.";
  }
};

function Reports() {
  const [search, setSearch] = useState("");
  const [exportsList, setExportsList] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState("");
  const [downloadingId, setDownloadingId] = useState(null);
  const [error, setError] = useState("");

  // =====================================
  // FETCH REPORT HISTORY
  // =====================================

  const fetchReportHistory = useCallback(async () => {
    try {
      setRefreshing(true);
      setError("");

      const token = getToken();

      if (!token) {
        throw new Error(
          "Authentication token not found. Please login again."
        );
      }

      const response = await fetch(`${API_URL}/history`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.status === 401 || response.status === 403) {
        throw new Error(
          "Session expired or access denied. Please login again."
        );
      }

      if (!response.ok) {
        throw new Error(await getResponseError(response));
      }

      const result = await response.json();

      if (result.success === false) {
        throw new Error(
          result.message || "Failed to fetch report history."
        );
      }

      const reports = Array.isArray(result.data)
        ? result.data
        : [];

      setExportsList(reports);

    } catch (err) {
      console.error("Report History Error:", err);
      setError(err.message || "Unable to load report history.");
      setExportsList([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // =====================================
  // INITIAL LOAD
  // =====================================

  useEffect(() => {
    fetchReportHistory();
  }, [fetchReportHistory]);

  // =====================================
  // GLOBAL SEARCH
  // =====================================

  useEffect(() => {
    const handleSearch = (event) => {
      setSearch(event.detail || "");
    };

    window.addEventListener("account-search", handleSearch);

    return () => {
      window.removeEventListener("account-search", handleSearch);
    };
  }, []);

  // =====================================
  // GLOBAL REFRESH
  // =====================================

  useEffect(() => {
    const handleRefresh = () => {
      fetchReportHistory();
    };

    window.addEventListener("dashboard-refresh", handleRefresh);

    return () => {
      window.removeEventListener("dashboard-refresh", handleRefresh);
    };
  }, [fetchReportHistory]);

  // =====================================
  // FILTER REPORT HISTORY
  // =====================================

  const filteredExports = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    if (!searchValue) return exportsList;

    return exportsList.filter((item) => {
      const reportName = String(
        item.reportName || ""
      ).toLowerCase();

      const reportType = String(
        item.reportType || ""
      ).toLowerCase();

      const format = String(
        item.exportFormat || ""
      ).toLowerCase();

      const status = String(
        item.status || ""
      ).toLowerCase();

      return (
        reportName.includes(searchValue) ||
        reportType.includes(searchValue) ||
        format.includes(searchValue) ||
        status.includes(searchValue)
      );
    });
  }, [exportsList, search]);

  // =====================================
  // FILTER REPORT TEMPLATES
  // =====================================

  const filteredReports = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    if (!searchValue) return reportCards;

    return reportCards.filter((report) =>
      `${report.category} ${report.title}`
        .toLowerCase()
        .includes(searchValue)
    );
  }, [search]);

  // =====================================
  // GENERATE REPORT API
  // =====================================

  const handleReport = async (report, format) => {
    const requestKey = `${report.type}-${format}`;

    if (generating) return;

    try {
      setGenerating(requestKey);
      setError("");

      const token = getToken();

      if (!token) {
        throw new Error(
          "Authentication token not found. Please login again."
        );
      }

      const reportName = `${report.title} - ${new Date()
        .toISOString()
        .slice(0, 10)}`;

      const response = await fetch(`${API_URL}/generate`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reportType: report.type,
          exportFormat: format.toLowerCase(),
          reportName,
        }),
      });

      if (response.status === 401 || response.status === 403) {
        throw new Error(
          "Session expired or access denied. Please login again."
        );
      }

      if (!response.ok) {
        throw new Error(await getResponseError(response));
      }

      // Backend returns the generated file directly.
      const blob = await response.blob();

      const fileName = getFileName(
        response.headers.get("Content-Disposition"),
        `${report.type}.${format.toLowerCase()}`
      );

      downloadBlob(blob, fileName);

      // Refresh actual report history from PostgreSQL.
      await fetchReportHistory();

    } catch (err) {
      console.error("Generate Report Error:", err);
      setError(err.message || "Failed to generate report.");
    } finally {
      setGenerating("");
    }
  };

  // =====================================
  // DOWNLOAD EXISTING REPORT API
  // =====================================

  const handleDownload = async (report) => {
    if (downloadingId !== null) return;

    try {
      setDownloadingId(report.id);
      setError("");

      const token = getToken();

      if (!token) {
        throw new Error(
          "Authentication token not found. Please login again."
        );
      }

      if (report.status !== "completed") {
        throw new Error(
          "This report is not completed yet."
        );
      }

      const response = await fetch(
        `${API_URL}/download/${encodeURIComponent(report.id)}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 401 || response.status === 403) {
        throw new Error(
          "Session expired or access denied. Please login again."
        );
      }

      if (!response.ok) {
        throw new Error(await getResponseError(response));
      }

      const blob = await response.blob();

      const extension = report.exportFormat || "pdf";

      const fileName = getFileName(
        response.headers.get("Content-Disposition"),
        `${report.reportName || "report"}.${extension}`
      );

      downloadBlob(blob, fileName);

    } catch (err) {
      console.error("Download Report Error:", err);
      setError(err.message || "Failed to download report.");
    } finally {
      setDownloadingId(null);
    }
  };

  // =====================================
  // RENDER
  // =====================================

  return (
    <div className="reports-page">

      {/* PAGE HEADING */}

      <div className="reports-header">
        <div>
          <h1>Reports</h1>
          <p>Export and schedule client reports.</p>
        </div>
      </div>

      {/* ERROR MESSAGE */}

      {error && (
        <div className="reports-empty">
          <p>{error}</p>

          <button
            type="button"
            onClick={fetchReportHistory}
          >
            Try Again
          </button>
        </div>
      )}

      {/* REPORT CARDS */}

      <section className="reports-cards">
        {filteredReports.map((report) => (
          <div
            className={`report-card ${
              report.type === "account_performance"
                ? "weekly"
                : report.type === "client_performance"
                ? "monthly"
                : report.type === "balance_report"
                ? "balance"
                : "campaign"
            }`}
            key={report.id}
          >
            <p className="report-category">
              {report.category}
            </p>

            <h2>{report.title}</h2>

            <div className="report-buttons">
              <button
                type="button"
                disabled={generating !== ""}
                onClick={() => handleReport(report, "pdf")}
              >
                {generating === `${report.type}-pdf`
                  ? "Generating..."
                  : "PDF"}
              </button>

              <button
                type="button"
                disabled={generating !== ""}
                onClick={() => handleReport(report, "csv")}
              >
                {generating === `${report.type}-csv`
                  ? "Generating..."
                  : "CSV"}
              </button>
            </div>
          </div>
        ))}

        {filteredReports.length === 0 && (
          <div className="reports-empty">
            No matching report templates found.
          </div>
        )}
      </section>

      {/* RECENT EXPORTS */}

      <section className="recent-exports">

        <div className="exports-header">
          <div>
            <h2>Recent exports</h2>
            <p>Previously generated reports</p>
          </div>

          <span className="exports-count">
            {filteredExports.length} reports
          </span>
        </div>

        {/* REFRESH STATUS */}

        {refreshing && (
          <p className="reports-refresh-status">
            Refreshing reports...
          </p>
        )}

        {/* LOADING */}

        {loading && (
          <div className="exports-empty">
            Loading report history...
          </div>
        )}

        {/* REPORT HISTORY */}

        {!loading && (
          <div className="exports-list">

            {filteredExports.map((item) => {
              const format = String(
                item.exportFormat || ""
              ).toUpperCase();

              const status = String(
                item.status || "unknown"
              ).toLowerCase();

              const isDownloading =
                String(downloadingId) === String(item.id);

              return (
                <div className="export-row" key={item.id}>

                  <div className="export-file-info">

                    <div className="export-file-icon">
                      {format || "FILE"}
                    </div>

                    <div className="export-file-details">
                      <span className="export-name">
                        {item.reportName || "Untitled Report"}
                      </span>

                      <span className="export-date-mobile">
                        {formatDate(item.createdAt)}
                      </span>
                    </div>

                  </div>

                  <span className="export-date">
                    {formatDate(item.createdAt)}
                  </span>

                  <span className={`report-status ${status}`}>
                    {status}
                  </span>

                  <button
                    type="button"
                    className="export-download"
                    disabled={
                      status !== "completed" ||
                      downloadingId !== null
                    }
                    onClick={() => handleDownload(item)}
                  >
                    {isDownloading
                      ? "Downloading..."
                      : "Download"}
                  </button>

                </div>
              );
            })}

            {filteredExports.length === 0 && (
              <div className="exports-empty">
                No reports found.
              </div>
            )}

          </div>
        )}

      </section>

    </div>
  );
}

export default Reports;
