import { useState } from "react";
import type { FormEvent } from "react";
import toast from "react-hot-toast";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { doctorApi } from "../api/doctor.api";
import { useAuthStore } from "../store/auth.store";
import type { UserRole } from "../types";
import { formatDoctorBio } from "../utils/display";

function Register() {
  const { register, isAuthenticated, role } = useAuthStore();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [selectedRole, setSelectedRole] = useState<UserRole>("patient");
  const [specialization, setSpecialization] = useState("");
  const [bio, setBio] = useState("");
  const [experience, setExperience] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isAuthenticated) {
    return <Navigate to={role === "doctor" ? "/doctor/dashboard" : "/patient/dashboard"} replace />;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    const toastId = toast.loading("Creating account...");

    try {
      const user = await register({
        email,
        password,
        name: fullName,
        role: selectedRole,
        specialization: selectedRole === "doctor" ? specialization : undefined
      });

      if (user.role === "doctor") {
        await doctorApi.updateMyProfile({
          name: fullName.trim(),
          specialization: specialization.trim(),
          bio: formatDoctorBio(bio, experience)
        });
      }

      toast.success("Registration successful", { id: toastId });
      navigate(user.role === "doctor" ? "/doctor/profile" : "/patient/dashboard", {
        replace: true
      });
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : "Registration failed";
      setError(message);
      toast.error(message, { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main style={{ maxWidth: 420, margin: "48px auto", fontFamily: "system-ui, sans-serif" }}>
      <h1>Register</h1>
      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12 }}>
        <label>
          Full name
          <input
            required
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
          />
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
          <>
            <label>
              Specialization
              <input
                required
                value={specialization}
                onChange={(event) => setSpecialization(event.target.value)}
              />
            </label>
            <label>
              Bio
              <textarea required value={bio} onChange={(event) => setBio(event.target.value)} />
            </label>
            <label>
              Experience
              <textarea
                value={experience}
                onChange={(event) => setExperience(event.target.value)}
              />
            </label>
          </>
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
