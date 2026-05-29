import { useState } from "react";
import type { FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/auth.store";
import type { UserRole } from "../types";

function Register() {
  const { register, isAuthenticated, role } = useAuthStore();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [selectedRole, setSelectedRole] = useState<UserRole>("patient");
  const [specialization, setSpecialization] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isAuthenticated) {
    return <Navigate to={role === "doctor" ? "/doctor/dashboard" : "/patient/dashboard"} replace />;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const user = await register({
        email,
        password,
        name,
        role: selectedRole,
        specialization: selectedRole === "doctor" ? specialization : undefined
      });

      navigate(user.role === "doctor" ? "/doctor/dashboard" : "/patient/dashboard", {
        replace: true
      });
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Registration failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main style={{ maxWidth: 420, margin: "48px auto", fontFamily: "system-ui, sans-serif" }}>
      <h1>Register</h1>
      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12 }}>
        <label>
          Name
          <input required value={name} onChange={(event) => setName(event.target.value)} />
        </label>
        <label>
          Email
          <input
            required
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        <label>
          Password
          <input
            required
            minLength={8}
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        <label>
          Role
          <select
            value={selectedRole}
            onChange={(event) => setSelectedRole(event.target.value as UserRole)}
          >
            <option value="patient">Patient</option>
            <option value="doctor">Doctor</option>
          </select>
        </label>
        {selectedRole === "doctor" && (
          <label>
            Specialization
            <input
              required
              value={specialization}
              onChange={(event) => setSpecialization(event.target.value)}
            />
          </label>
        )}
        {error && <p role="alert">{error}</p>}
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creating account..." : "Register"}
        </button>
      </form>
      <p>
        Already have an account? <Link to="/login">Login</Link>
      </p>
    </main>
  );
}

export default Register;
