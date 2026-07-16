import { Navigate, useLocation } from "react-router-dom";
import { useAdminAuth } from "./AdminAuthContext";
import { supabase } from "../lib/supabaseClient";

export default function ProtectedRoute({ children, allowedRoles }) {
  const { profile, status } = useAdminAuth();
  const location = useLocation();

  if (status === "loading") {
    return (
      <div className="admin-loading-screen">
        <div className="admin-spinner" aria-hidden="true"></div>
        <p>Checking your session…</p>
      </div>
    );
  }

  if (status === "signed-out") {
    return <Navigate to="/admin/login" replace state={{ from: location }} />;
  }

  if (status === "forbidden") {
    return (
      <div className="admin-loading-screen">
        <h1>Access not authorised</h1>
        <p>Your account is signed in but is not an active administrator on this system.</p>
        <p>Ask a super admin to add you, or sign in with a different account.</p>
        <SignOutLink />
      </div>
    );
  }

  if (allowedRoles && !allowedRoles.includes(profile.role)) {
    return (
      <div className="admin-loading-screen">
        <h1>Insufficient permissions</h1>
        <p>Your role ({profile.role}) does not have access to this page.</p>
      </div>
    );
  }

  return children;
}

function SignOutLink() {
  const { refreshProfile } = useAdminAuth();
  return (
    <button
      className="btn secondary"
      type="button"
      onClick={async () => {
        await supabase.auth.signOut();
        refreshProfile();
      }}
    >
      Sign out
    </button>
  );
}
