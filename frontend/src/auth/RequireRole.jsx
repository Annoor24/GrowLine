import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext.jsx";

// Wraps a group of routes: only a signed-in user with the matching role gets through.
export default function RequireRole({ role, loginPath }) {
  const { session } = useAuth();
  const location = useLocation();
  if (!session || session.role !== role) {
    return <Navigate to={loginPath} replace state={{ from: location }} />;
  }
  return <Outlet />;
}
