import { useEffect } from "react";
import toast, { Toaster, ToastBar } from "react-hot-toast";
import { Navigate, Route, Routes } from "react-router-dom";
import DoctorAppointmentDetail from "./pages/DoctorAppointmentDetail";
import AppLayout from "./layout/AppLayout";
import DoctorDashboard from "./pages/DoctorDashboard";
import DoctorProfile from "./pages/DoctorProfile";
import Login from "./pages/Login";
import PatientAppointments from "./pages/PatientAppointments";
import PatientDashboard from "./pages/PatientDashboard";
import PatientDoctorDetail from "./pages/PatientDoctorDetail";
import PatientDoctors from "./pages/PatientDoctors";
import PatientProfile from "./pages/PatientProfile";
import PatientRecords from "./pages/PatientRecords";
import Register from "./pages/Register";
import ProtectedRoute from "./routes/ProtectedRoute";
import RoleRoute from "./routes/RoleRoute";
import { useAuthStore } from "./store/auth.store";

const appToaster = (
  <Toaster
    gutter={10}
    position="bottom-right"
    toastOptions={{
      duration: 3500,
      error: {
        duration: 5500
      }
    }}
  >
    {(activeToast) => (
      <ToastBar
        toast={activeToast}
        style={{
          border: "1px solid #ddd",
          borderRadius: 6,
          boxShadow: "0 8px 24px rgba(0, 0, 0, 0.14)",
          maxWidth: "min(420px, calc(100vw - 32px))",
          padding: "10px 12px"
        }}
      >
        {({ icon, message }) => (
          <div style={{ alignItems: "flex-start", display: "flex", gap: 10, width: "100%" }}>
            <div style={{ flexShrink: 0 }}>{icon}</div>
            <div style={{ flex: 1, minWidth: 0 }}>{message}</div>
            <button
              type="button"
              aria-label="Dismiss notification"
              onClick={() => toast.dismiss(activeToast.id)}
              style={{
                background: "transparent",
                border: 0,
                cursor: "pointer",
                flexShrink: 0,
                fontSize: 18,
                lineHeight: 1,
                padding: "0 2px"
              }}
            >
              ×
            </button>
          </div>
        )}
      </ToastBar>
    )}
  </Toaster>
);

function App() {
  const { initialize, isLoading, isAuthenticated, role } = useAuthStore();

  useEffect(() => {
    void initialize();
  }, [initialize]);

  if (isLoading) {
    return (
      <>
        {appToaster}
        <main style={{ padding: 24 }}>Loading...</main>
      </>
    );
  }

  const homePath = isAuthenticated
    ? role === "doctor"
      ? "/doctor/dashboard"
      : "/patient/dashboard"
    : "/login";

  return (
    <>
      {appToaster}
      <Routes>
        <Route path="/" element={<Navigate to={homePath} replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route element={<RoleRoute allowedRoles={["patient"]} />}>
              <Route path="/patient/dashboard" element={<PatientDashboard />} />
              <Route path="/patient/profile" element={<PatientProfile />} />
              <Route path="/patient/doctors" element={<PatientDoctors />} />
              <Route path="/patient/doctors/:id" element={<PatientDoctorDetail />} />
              <Route path="/patient/appointments" element={<PatientAppointments />} />
              <Route path="/patient/records" element={<PatientRecords />} />
            </Route>

            <Route element={<RoleRoute allowedRoles={["doctor"]} />}>
              <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
              <Route path="/doctor/profile" element={<DoctorProfile />} />
              <Route path="/doctor/appointments/:id" element={<DoctorAppointmentDetail />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<Navigate to={homePath} replace />} />
      </Routes>
    </>
  );
}

export default App;
