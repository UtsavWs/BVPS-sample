import { useContext, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { PROTECTED_PATHS } from "../paths";

export default function PublicRoutes() {
  const { isAuthenticated, isInitializing } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isInitializing && isAuthenticated) {
      navigate(PROTECTED_PATHS.DASHBOARD, { replace: true });
    }
  }, [isAuthenticated, isInitializing, navigate]);

  if (isInitializing || isAuthenticated) return null;

  return <Outlet />;
}
