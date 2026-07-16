import React, { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAdminAuth } from "./AdminAuthContext";
import { signOutAdmin } from "../lib/roomsApi";

const NAV_ITEMS = [
  { to: "/admin", label: "Dashboard", end: true },
  { to: "/admin/rooms", label: "Rooms" },
  { to: "/admin/rooms/new", label: "Add Room" },
  { to: "/admin/rooms/archive", label: "Archive" },
  { to: "/admin/website-photos", label: "Media Library" },
  { to: "/admin/security", label: "Security" },
];

export default function AdminLayout() {
  const { refreshProfile } = useAdminAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOutAdmin();
    await refreshProfile();
    navigate("/admin/login", { replace: true });
  }

  return (
    <div className="admin-shell">
      <header className="admin-topbar">
        <button
          className="admin-menu-toggle"
          aria-expanded={menuOpen}
          aria-controls="admin-sidebar"
          aria-label={menuOpen ? "Close admin menu" : "Open admin menu"}
          onClick={() => setMenuOpen((v) => !v)}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
        <a className="brand admin-brand" href="/admin">
          <span className="brand-mark">DH</span>
          <span>
            <strong>Desert Haveli</strong>
            <small>Admin Panel</small>
          </span>
        </a>
        <div className="admin-topbar-actions">
          <a className="btn small ghost-light" href="/" target="_blank" rel="noreferrer">
            View public site
          </a>
          <button className="btn small secondary" type="button" onClick={handleSignOut}>
            Sign out
          </button>
        </div>
      </header>

      <div className="admin-body">
        <nav id="admin-sidebar" className={`admin-sidebar ${menuOpen ? "open" : ""}`}>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        {menuOpen && <div className="admin-sidebar-scrim" onClick={() => setMenuOpen(false)} />}

        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
