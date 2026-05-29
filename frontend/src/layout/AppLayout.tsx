import { Link, Outlet, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/auth.store";

function AppLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", minHeight: "100vh" }}>
      <header
        style={{
          alignItems: "center",
          borderBottom: "1px solid #ddd",
          display: "flex",
          justifyContent: "space-between",
          padding: 16
        }}
      >
        <Link to={user?.role === "doctor" ? "/doctor/dashboard" : "/patient/dashboard"}>
          Telehealth MVP
        </Link>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <span>{user?.role}</span>
          <button type="button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>
      <Outlet />
    </div>
  );
}

export default AppLayout;
