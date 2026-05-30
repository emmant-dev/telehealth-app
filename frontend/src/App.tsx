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
      >
        {({ icon, message }) => (
          <div className="flex w-[calc(100vw-32px)] items-start gap-2.5 rounded-[18px] border border-[#DDEEDD] bg-white p-3.5 text-[#111111] shadow-[0_18px_45px_rgba(12,154,61,0.14)] sm:w-[420px] md:w-[460px]">
            <div className="shrink-0">{icon}</div>
            <div className="min-w-0 flex-1">{message}</div>
            <button
              type="button"
              aria-label="Dismiss notification"
              onClick={() => toast.dismiss(activeToast.id)}
              className="min-h-0 shrink-0 cursor-pointer border-0 bg-transparent px-0.5 text-lg leading-none text-[#0C9A3D] shadow-none hover:text-[#14B84A]"
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
        <main className="mx-auto w-full px-4 py-6 text-[#111111] sm:px-6 sm:py-8 md:max-w-[920px] md:py-10 lg:max-w-[1120px] lg:px-0 lg:py-11">Loading...</main>
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
