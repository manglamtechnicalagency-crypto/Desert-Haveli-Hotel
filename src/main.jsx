import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";
import App from "./App";
import "./admin/admin.css";
import { AdminAuthProvider } from "./admin/AdminAuthContext";
import ProtectedRoute from "./admin/ProtectedRoute";
import AdminLoginPage from "./admin/AdminLoginPage";
import AdminLayout from "./admin/AdminLayout";
import AdminDashboardPage from "./admin/AdminDashboardPage";
import AdminSiteImagesPage from "./admin/AdminSiteImagesPage";
import AdminRoomsListPage from "./admin/AdminRoomsListPage";
import AdminRoomFormPage from "./admin/AdminRoomFormPage";

// Minimal top-level error boundary. Without this, any uncaught render-time
// exception (e.g. an unexpected null/undefined field from Supabase) blanks
// the entire page for the guest or admin instead of failing gracefully.
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error("Unhandled render error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "3rem 1.5rem", textAlign: "center", fontFamily: "sans-serif" }}>
          <h1>Something went wrong</h1>
          <p>Please refresh the page. If this keeps happening, contact the hotel directly.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

function AdminApp() {
  return (
    <AdminAuthProvider>
      <AdminNoIndex />
      <Routes>
        <Route path="login" element={<AdminLoginPage />} />
        <Route
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboardPage />} />
          <Route path="website-photos" element={<AdminSiteImagesPage />} />
          <Route path="rooms" element={<AdminRoomsListPage />} />
          <Route path="rooms/new" element={<AdminRoomFormPage />} />
          <Route path="rooms/:id/edit" element={<AdminRoomFormPage />} />
          <Route path="rooms/archive" element={<AdminRoomsListPage archiveView />} />
        </Route>
      </Routes>
    </AdminAuthProvider>
  );
}

function AdminNoIndex() {
  React.useEffect(() => {
    let robots = document.querySelector('meta[name="robots"]');
    if (!robots) {
      robots = document.createElement("meta");
      robots.name = "robots";
      document.head.appendChild(robots);
    }
    const previous = robots.content;
    robots.content = "noindex,nofollow,noarchive";
    return () => { robots.content = previous || "index,follow"; };
  }, []);
  return null;
}

function NotFound() {
  return (
    <main style={{ minHeight: "70vh", display: "grid", placeItems: "center", padding: "5rem 1.5rem", textAlign: "center" }}>
      <div><p className="eyebrow">404</p><h1>Page not found</h1><p>The page you requested does not exist.</p><a className="btn primary" href="/">Return to the hotel website</a></div>
    </main>
  );
}

function PublicRoute() {
  const path = window.location.pathname.replace(/\/$/, "") || "/";
  const known = ["", "/", "/about", "/rooms", "/rooftop-restaurant", "/experiences", "/gallery", "/explore-jaisalmer", "/contact", "/faq", "/privacy-policy", "/terms-and-conditions", "/cancellation-policy"];
  if (known.includes(path) || path.startsWith("/rooms/")) return <App />;
  return <NotFound />;
}

function Root() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/admin/*" element={<AdminApp />} />
          <Route path="/*" element={<PublicRoute />} />
        </Routes>
      </BrowserRouter>
      <Analytics />
    </ErrorBoundary>
  );
}

createRoot(document.getElementById("root")).render(<Root />);
