import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { appointmentApi } from "../api/appointment.api";
import { notificationApi } from "../api/notification.api";
import { patientApi } from "../api/patient.api";
import type { Appointment, Notification, PatientProfile } from "../types";
import { subscribeToRefreshEvents } from "../utils/refreshEvents";
import { ui } from "../utils/ui";

function PatientDashboard() {
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async () => {
    try {
      const [patientProfile, patientAppointments, userNotifications] = await Promise.all([
        patientApi.getMe(),
        appointmentApi.listMine(),
        notificationApi.listMine()
      ]);
      setProfile(patientProfile);
      setAppointments(patientAppointments);
      setNotifications(userNotifications);
      setError("");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to load dashboard");
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadInitialDashboard = async () => {
      try {
        const [patientProfile, patientAppointments, userNotifications] = await Promise.all([
          patientApi.getMe(),
          appointmentApi.listMine(),
          notificationApi.listMine()
        ]);

        if (!isMounted) {
          return;
        }

        setProfile(patientProfile);
        setAppointments(patientAppointments);
        setNotifications(userNotifications);
        setError("");
      } catch (caughtError) {
        if (isMounted) {
          setError(caughtError instanceof Error ? caughtError.message : "Unable to load dashboard");
        }
      }
    };

    void loadInitialDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    return subscribeToRefreshEvents((eventType) => {
      if (eventType === "appointments" || eventType === "medical-records") {
        void loadDashboard();
      }
    });
  }, [loadDashboard]);

  return (
    <main className={ui.page}>
      <h1 className={ui.heading1}>Patient Dashboard</h1>
      {error && <p className={ui.alert} role="alert">{error}</p>}
      <section className={ui.section}>
        <h2 className={ui.heading2}>Profile</h2>
        <p className={ui.muted}>{profile ? profile.name : "Loading profile..."}</p>
        <p>
          <Link className={ui.linkButton} to="/patient/profile">Complete or update my profile</Link>
        </p>
      </section>
      <section className={ui.section}>
        <h2 className={ui.heading2}>Actions</h2>
        <p>
          <Link className={ui.linkButton} to="/patient/doctors">View doctors and book an appointment</Link>
        </p>
        <p>
          <Link className={ui.linkButton} to="/patient/appointments">View my appointments</Link>
        </p>
        <p>
          <Link className={ui.linkButton} to="/patient/records">View medical records</Link>
        </p>
      </section>
      <section className={ui.section}>
        <h2 className={ui.heading2}>Appointments</h2>
        <p className={ui.muted}>{appointments.length} appointment(s)</p>
      </section>
      <section className={ui.section}>
        <h2 className={ui.heading2}>Notifications</h2>
        <p className={ui.muted}>{notifications.length} notification(s)</p>
      </section>
    </main>
  );
}

export default PatientDashboard;
