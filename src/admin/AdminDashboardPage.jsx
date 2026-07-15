import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchDashboardStats } from "../lib/roomsApi";
import { formatCurrency } from "../lib/pricing";

const PRIMARY_STAT_DEFS = [
  ["totalRooms", "Total Rooms"],
  ["availableRooms", "Available Now"],
  ["publishedRooms", "Published"],
];

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDashboardStats()
      .then(setStats)
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div><span className="admin-kicker">PRIVATE HOTEL OPERATIONS</span><h1>Dashboard</h1><p>Overview of room inventory, pricing, and availability.</p></div>
        <span className="admin-live-indicator"><i /> Live workspace</span>
      </div>

      {error && <p className="admin-form-error">{error}</p>}

      {!stats && !error && <p>Loading dashboard…</p>}

      {stats && (
        <>
          <div className="admin-stat-grid admin-stat-grid-primary">
            {PRIMARY_STAT_DEFS.map(([key, label]) => (
              <div className="admin-stat-card" data-stat={key} key={key}>
                <strong>{stats[key]}</strong>
                <span>{label}</span>
              </div>
            ))}
            <div className="admin-stat-card" data-stat="averagePrice">
              <strong>{stats.averagePrice != null ? formatCurrency(stats.averagePrice) : "—"}</strong>
              <span>Average Price</span>
            </div>
          </div>

          <div className="admin-quick-actions admin-action-panel">
            <div><span className="admin-kicker">QUICK ACTIONS</span><strong>Keep the guest-facing stay current</strong></div>
            <div className="admin-action-buttons">
            <Link className="btn primary" to="/admin/rooms/new">
              + Add Room
            </Link>
            <Link className="btn secondary" to="/admin/rooms">
              Manage Rooms
            </Link>
            <Link className="btn secondary" to="/admin/rooms/archive">
              View Archive
            </Link>
            <a className="btn ghost-light" href="/" target="_blank" rel="noreferrer">
              Open Public Website
            </a>
            </div>
          </div>

          <section className="admin-section">
            <h2>Recently Updated Rooms</h2>
            {stats.recentlyUpdated.length === 0 ? (
              <p className="admin-empty">No rooms yet.</p>
            ) : (
              <ul className="admin-recent-list">
                {stats.recentlyUpdated.map((r) => (
                  <li key={r.id}>
                    <Link to={`/admin/rooms/${r.id}/edit`}>
                      Room {r.room_number} · {r.name}
                    </Link>
                    <span>{new Date(r.updated_at).toLocaleString()}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}
