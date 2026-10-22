import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./authContext";

function AuthLoading() {
  return (
    <div className="auth-loading" role="status">
      <i className="fa-solid fa-spinner fa-spin" aria-hidden="true" />
      Loading…
    </div>
  );
}

/** Wraps every page that needs a signed-in user. Anyone else goes to the
 *  login page, which brings them back here afterwards. */
export function RequireAuth() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === "loading") return <AuthLoading />;
  if (status === "signedOut") {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }
  return <Outlet />;
}

/** Pages only an Admin may open (e.g. Users). Others land on the dashboard. */
export function RequireAdmin() {
  const { user } = useAuth();
  if (user?.role !== "admin") return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}
