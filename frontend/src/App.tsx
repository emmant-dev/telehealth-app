import { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import DoctorAppointmentDetail from "./pages/DoctorAppointmentDetail";
import AppLayout from "./layout/AppLayout";
import DoctorDashboard from "./pages/DoctorDashboard";
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

function App() {
  const { initialize, isLoading, isAuthenticated, role } = useAuthStore();

  useEffect(() => {
    void initialize();
  }, [initialize]);

  if (isLoading) {
    return <main style={{ padding: 24 }}>Loading...</main>;
  }

  const homePath = isAuthenticated
    ? role === "doctor"
      ? "/doctor/dashboard"
      : "/patient/dashboard"
    : "/login";

  return (
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
            <Route path="/doctor/appointments/:id" element={<DoctorAppointmentDetail />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to={homePath} replace />} />
    </Routes>
  );
}

export default App;
