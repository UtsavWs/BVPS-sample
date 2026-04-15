import { useContext } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { PROTECTED_PATHS } from "../paths";

export default function PublicRoutes() {
  const { isAuthenticated, loading } = useContext(AuthContext);

  if (loading) return null;

  return isAuthenticated
    ? <Navigate to={PROTECTED_PATHS.DASHBOARD} replace />
    : <Outlet />;
}
