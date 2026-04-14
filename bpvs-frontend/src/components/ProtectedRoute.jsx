import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import LoadingScreen from "./LoadingScreen";

/**
 * ProtectedRoute — wraps routes that require authentication.
 *
 * Props:
 *   children    – the page component to render
 *   adminOnly   – if true, only users with role "admin" can access
 */
export default function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading, isAuthenticated, isAdmin } = useContext(AuthContext);

  // Still checking auth state → show loader
  if (loading) {
    return <LoadingScreen />;
  }

  // Not logged in → redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Account not yet active → redirect to pending approval
  if (user?.status === "inactive") {
    return <Navigate to="/pending-approval" replace />;
  }

  // Admin-only route but user isn't admin
  if (adminOnly && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
