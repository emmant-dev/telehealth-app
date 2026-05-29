import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { doctorApi } from "../api/doctor.api";
import type { Appointment, DoctorProfile } from "../types";
import { formatAppointmentDate, getAppointmentCounterparty } from "../utils/display";

const isToday = (dateValue: string): boolean => {
  const date = new Date(dateValue);
  const now = new Date();

  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
};

function DoctorDashboard() {
  const [profile, setProfile] = useState<DoctorProfile | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadDashboard = async () => {
      try {
        const [doctorProfile, doctorAppointments] = await Promise.all([
          doctorApi.getMyProfile(),
          doctorApi.getAppointments()
        ]);

        if (!isMounted) {
          return;
        }

        setProfile(doctorProfile);
        setAppointments(doctorAppointments);
      } catch (caughtError) {
        if (isMounted) {
          setError(caughtError instanceof Error ? caughtError.message : "Unable to load dashboard");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  const todaysAppointments = useMemo(() => {
    return appointments
      .filter((appointment) => isToday(appointment.appointmentAt))
      .sort(
        (a, b) =>
          new Date(a.appointmentAt).getTime() - new Date(b.appointmentAt).getTime()
      );
  }, [appointments]);

  return (
    <main style={{ padding: 24 }}>
      <h1>Doctor Dashboard</h1>
      {error && <p role="alert">{error}</p>}

      <section>
        <h2>Profile</h2>
        <p>{profile ? `${profile.name} - ${profile.specialization}` : "Loading profile..."}</p>
      </section>

      <section>
        <h2>Today&apos;s Appointments</h2>
        {isLoading && <p>Loading appointments...</p>}
        {!isLoading && todaysAppointments.length === 0 && <p>No appointments scheduled for today.</p>}
        <div style={{ display: "grid", gap: 12 }}>
          {todaysAppointments.map((appointment) => (
            <article key={appointment._id} style={{ border: "1px solid #ddd", padding: 12 }}>
              <h3>{formatAppointmentDate(appointment.appointmentAt)}</h3>
              <p>Patient: {getAppointmentCounterparty(appointment, "doctor")}</p>
              <p>Status: {appointment.status}</p>
              <Link to={`/doctor/appointments/${appointment._id}`}>View Details</Link>
            </article>
          ))}
        </div>
      </section>

      <section>
        <h2>All Appointments</h2>
        <p>{appointments.length} total appointment(s)</p>
      </section>
    </main>
  );
}

export default DoctorDashboard;
