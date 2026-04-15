import { useContext } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { PUBLIC_PATHS } from "../paths";

export default function ProtectedRoutes() {
  const { isAuthenticated, loading } = useContext(AuthContext);
  const location = useLocation();

  if (loading) return null;

  return isAuthenticated
    ? <Outlet />
    : <Navigate to={PUBLIC_PATHS.LOGIN} state={{ from: location }} replace />;
}
