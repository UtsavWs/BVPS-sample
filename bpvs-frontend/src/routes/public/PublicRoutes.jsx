import { useContext, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { PROTECTED_PATHS } from "../paths";

export default function PublicRoutes() {
  const { isAuthenticated, loading } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate(PROTECTED_PATHS.DASHBOARD, { replace: true });
    }
  }, [isAuthenticated, loading, navigate]);

  if (loading || isAuthenticated) return null;

  return <Outlet />;
}
