import { useState } from "react";
import type { FormEvent } from "react";
import toast from "react-hot-toast";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { doctorApi } from "../api/doctor.api";
import { useAuthStore } from "../store/auth.store";
import type { UserRole } from "../types";
import { formatDoctorBio } from "../utils/display";
import { ui } from "../utils/ui";

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
    <main className={ui.authPage}>
      <h1 className={ui.heading1}>Register</h1>
      <form onSubmit={handleSubmit} className={ui.form}>
        <label className={ui.label}>
          Full name
          <input
            className={ui.input}
            required
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
          />
        </label>
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
            minLength={8}
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        <label className={ui.label}>
          Role
          <select
            className={ui.input}
            value={selectedRole}
            onChange={(event) => setSelectedRole(event.target.value as UserRole)}
          >
            <option value="patient">Patient</option>
            <option value="doctor">Doctor</option>
          </select>
        </label>
        {selectedRole === "doctor" && (
          <>
            <label className={ui.label}>
              Specialization
              <input
                className={ui.input}
                required
                value={specialization}
                onChange={(event) => setSpecialization(event.target.value)}
              />
            </label>
            <label className={ui.label}>
              Bio
              <textarea className={ui.textarea} required value={bio} onChange={(event) => setBio(event.target.value)} />
            </label>
            <label className={ui.label}>
              Experience
              <textarea
                className={ui.textarea}
                value={experience}
                onChange={(event) => setExperience(event.target.value)}
              />
            </label>
          </>
        )}
        {error && <p className={ui.alert} role="alert">{error}</p>}
        <button className={ui.button} type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creating account..." : "Register"}
        </button>
      </form>
      <p className={`${ui.muted} mt-5`}>
        Already have an account? <Link to="/login">Login</Link>
      </p>
    </main>
  );
}

export default Register;
