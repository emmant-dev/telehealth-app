import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { appointmentApi } from "../api/appointment.api";
import { notificationApi } from "../api/notification.api";
import { patientApi } from "../api/patient.api";
import type { Appointment, Notification, PatientProfile } from "../types";

function PatientDashboard() {
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [patientProfile, patientAppointments, userNotifications] = await Promise.all([
          patientApi.getMe(),
          appointmentApi.listMine(),
          notificationApi.listMine()
        ]);
        setProfile(patientProfile);
        setAppointments(patientAppointments);
        setNotifications(userNotifications);
      } catch (caughtError) {
        setError(caughtError instanceof Error ? caughtError.message : "Unable to load dashboard");
      }
    };

    void loadDashboard();
  }, []);

  return (
    <main style={{ padding: 24 }}>
      <h1>Patient Dashboard</h1>
      {error && <p role="alert">{error}</p>}
      <section>
        <h2>Profile</h2>
        <p>{profile ? profile.name : "Loading profile..."}</p>
        <p>
          <Link to="/patient/profile">Complete or update my profile</Link>
        </p>
      </section>
      <section>
        <h2>Actions</h2>
        <p>
          <Link to="/patient/doctors">View doctors and book an appointment</Link>
        </p>
        <p>
          <Link to="/patient/appointments">View my appointments</Link>
        </p>
        <p>
          <Link to="/patient/records">View medical records</Link>
        </p>
      </section>
      <section>
        <h2>Appointments</h2>
        <p>{appointments.length} appointment(s)</p>
      </section>
      <section>
        <h2>Notifications</h2>
        <p>{notifications.length} notification(s)</p>
      </section>
    </main>
  );
}

export default PatientDashboard;
