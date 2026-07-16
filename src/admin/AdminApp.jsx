import React from "react";
import { Routes, Route } from "react-router-dom";
import { AdminAuthProvider } from "./AdminAuthContext";
import ProtectedRoute from "./ProtectedRoute";
import AdminLoginPage from "./AdminLoginPage";
import AdminLayout from "./AdminLayout";
import AdminDashboardPage from "./AdminDashboardPage";
import AdminSiteImagesPage from "./AdminSiteImagesPage";
import AdminRoomsListPage from "./AdminRoomsListPage";
import AdminRoomFormPage from "./AdminRoomFormPage";
import AdminSecurityPage from "./AdminSecurityPage";
import "./admin.css";

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

export default function AdminApp() {
  return (
    <AdminAuthProvider>
      <AdminNoIndex />
      <Routes>
        <Route path="login" element={<AdminLoginPage />} />
        <Route element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
          <Route index element={<AdminDashboardPage />} />
          <Route path="website-photos" element={<AdminSiteImagesPage />} />
          <Route path="rooms" element={<AdminRoomsListPage />} />
          <Route path="rooms/new" element={<AdminRoomFormPage />} />
          <Route path="rooms/:id/edit" element={<AdminRoomFormPage />} />
          <Route path="rooms/archive" element={<AdminRoomsListPage archiveView />} />
          <Route path="security" element={<AdminSecurityPage />} />
        </Route>
      </Routes>
    </AdminAuthProvider>
  );
}
