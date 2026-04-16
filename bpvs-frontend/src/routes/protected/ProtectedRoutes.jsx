import { useContext, useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { PUBLIC_PATHS } from "../paths";

export default function ProtectedRoutes() {
  const { isAuthenticated, loading } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate(PUBLIC_PATHS.LOGIN, { state: { from: location }, replace: true });
    }
  }, [isAuthenticated, loading, location, navigate]);

  if (loading || !isAuthenticated) return null;

  return <Outlet />;
}
