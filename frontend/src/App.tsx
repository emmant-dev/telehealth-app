import { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "./layout/AppLayout";
import DoctorDashboard from "./pages/DoctorDashboard";
import Login from "./pages/Login";
import PatientDashboard from "./pages/PatientDashboard";
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
          </Route>

          <Route element={<RoleRoute allowedRoles={["doctor"]} />}>
            <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to={homePath} replace />} />
    </Routes>
  );
}

export default App;
