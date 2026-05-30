import { Link, Outlet, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/auth.store";
import { ui } from "../utils/ui";

function AppLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(214,255,215,0.78),transparent_34rem),linear-gradient(180deg,#ffffff_0%,#f7fff5_46%,#ffffff_100%)] font-sans text-[#111111]">
      <header
        className="sticky top-0 z-20 flex flex-col items-stretch gap-3 border-b border-[#DDEEDD] bg-white/95 px-4 py-3 shadow-[0_8px_24px_rgba(17,17,17,0.04)] sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4 lg:px-7"
      >
        <nav className="flex flex-wrap items-center gap-2 sm:gap-3">
          <Link
            className="mr-1 inline-flex min-w-0 items-center gap-2 text-base font-extrabold text-[#111111] no-underline before:h-7 before:w-7 before:shrink-0 before:rounded-[10px] before:bg-gradient-to-br before:from-[#14B84A] before:to-[#0C9A3D] before:shadow-[0_10px_18px_rgba(20,184,74,0.24)] hover:text-[#0C9A3D] hover:no-underline sm:gap-2.5 sm:text-[1.05rem]"
            to={user?.role === "doctor" ? "/doctor/dashboard" : "/patient/dashboard"}
          >
            Telehealth MVP
          </Link>
          {user?.role === "patient" && (
            <>
              <Link className="rounded-full px-2.5 py-2 text-sm font-bold text-[#666666] no-underline hover:bg-[#EAFFE0] hover:text-[#0C9A3D] sm:px-3 sm:text-base" to="/patient/profile">Profile</Link>
              <Link className="rounded-full px-2.5 py-2 text-sm font-bold text-[#666666] no-underline hover:bg-[#EAFFE0] hover:text-[#0C9A3D] sm:px-3 sm:text-base" to="/patient/doctors">Doctors</Link>
              <Link className="rounded-full px-2.5 py-2 text-sm font-bold text-[#666666] no-underline hover:bg-[#EAFFE0] hover:text-[#0C9A3D] sm:px-3 sm:text-base" to="/patient/appointments">Appointments</Link>
              <Link className="rounded-full px-2.5 py-2 text-sm font-bold text-[#666666] no-underline hover:bg-[#EAFFE0] hover:text-[#0C9A3D] sm:px-3 sm:text-base" to="/patient/records">Records</Link>
            </>
          )}
          {user?.role === "doctor" && (
            <>
              <Link className="rounded-full px-2.5 py-2 text-sm font-bold text-[#666666] no-underline hover:bg-[#EAFFE0] hover:text-[#0C9A3D] sm:px-3 sm:text-base" to="/doctor/dashboard">Appointments</Link>
              <Link className="rounded-full px-2.5 py-2 text-sm font-bold text-[#666666] no-underline hover:bg-[#EAFFE0] hover:text-[#0C9A3D] sm:px-3 sm:text-base" to="/doctor/profile">Profile</Link>
            </>
          )}
        </nav>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <span className="rounded-full border border-[#DDEEDD] bg-[#EAFFE0] px-3 py-2 text-sm font-extrabold capitalize text-[#0C9A3D]">
            {user?.role}
          </span>
          <button className={ui.button} type="button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>
      <Outlet />
    </div>
  );
}

export default AppLayout;
