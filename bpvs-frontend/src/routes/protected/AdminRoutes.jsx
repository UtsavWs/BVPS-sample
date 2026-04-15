import { useContext } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { PROTECTED_PATHS } from "../paths";

export default function AdminRoutes() {
  const { isStaff, loading } = useContext(AuthContext);

  if (loading) return null;

  return isStaff
    ? <Outlet />
    : <Navigate to={PROTECTED_PATHS.DASHBOARD} replace />;
}
