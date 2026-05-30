import { useState } from "react";
import type { FormEvent } from "react";
import toast from "react-hot-toast";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/auth.store";
import { ui } from "../utils/ui";

function Login() {
  const { login, isAuthenticated, role } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isAuthenticated) {
    return <Navigate to={role === "doctor" ? "/doctor/dashboard" : "/patient/dashboard"} replace />;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    const toastId = toast.loading("Logging in...");

    try {
      const user = await login({ email, password });
      toast.success("Login successful", { id: toastId });
      const from = location.state?.from?.pathname;
      navigate(from || (user.role === "doctor" ? "/doctor/dashboard" : "/patient/dashboard"), {
        replace: true
      });
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : "Login failed";
      setError(message);
      toast.error(message, { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className={ui.authPage}>
      <h1 className={ui.heading1}>Login</h1>
      <form onSubmit={handleSubmit} className={ui.form}>
        <label className={ui.label}>
          Email
          <input
            className={ui.input}
            required
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        <label className={ui.label}>
          Password
          <input
            className={ui.input}
            required
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        {error && <p className={ui.alert} role="alert">{error}</p>}
        <button className={ui.button} type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Logging in..." : "Login"}
        </button>
      </form>
      <p className={`${ui.muted} mt-5`}>
        No account? <Link to="/register">Register</Link>
      </p>
    </main>
  );
}

export default Login;
