import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../store/auth.store";
import type { UserRole } from "../types";

interface RoleRouteProps {
  allowedRoles: UserRole[];
}

function RoleRoute({ allowedRoles }: RoleRouteProps) {
  const { role } = useAuthStore();

  if (!role || !allowedRoles.includes(role)) {
    const fallback = role === "doctor" ? "/doctor/dashboard" : "/patient/dashboard";
    return <Navigate to={fallback} replace />;
  }

  return <Outlet />;
}

export default RoleRoute;
