import { useContext, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { PROTECTED_PATHS } from "../paths";

export default function AdminRoutes() {
  const { isStaff, loading } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !isStaff) {
      navigate(PROTECTED_PATHS.DASHBOARD, { replace: true });
    }
  }, [isStaff, loading, navigate]);

  if (loading || !isStaff) return null;

  return <Outlet />;
}
