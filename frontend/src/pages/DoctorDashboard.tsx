import { useEffect, useState } from "react";
import { appointmentApi } from "../api/appointment.api";
import { doctorApi } from "../api/doctor.api";
import { notificationApi } from "../api/notification.api";
import type { Appointment, DoctorProfile, Notification } from "../types";

function DoctorDashboard() {
  const [profile, setProfile] = useState<DoctorProfile | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [doctorProfile, doctorAppointments, userNotifications] = await Promise.all([
          doctorApi.getMyProfile(),
          appointmentApi.listMine(),
          notificationApi.listMine()
        ]);
        setProfile(doctorProfile);
        setAppointments(doctorAppointments);
        setNotifications(userNotifications);
      } catch (caughtError) {
        setError(caughtError instanceof Error ? caughtError.message : "Unable to load dashboard");
      }
    };

    void loadDashboard();
  }, []);

  return (
    <main style={{ padding: 24 }}>
      <h1>Doctor Dashboard</h1>
      {error && <p role="alert">{error}</p>}
      <section>
        <h2>Profile</h2>
        <p>{profile ? `${profile.name} - ${profile.specialization}` : "Loading profile..."}</p>
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

export default DoctorDashboard;
