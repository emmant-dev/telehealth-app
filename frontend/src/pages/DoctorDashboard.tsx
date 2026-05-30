import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { doctorApi } from "../api/doctor.api";
import type { Appointment, DoctorProfile } from "../types";
import { useDoctorAppointments } from "../hooks/useDoctorAppointments";
import {
  formatAppointmentDate,
  formatAppointmentTime,
  getAppointmentCounterparty,
  getAppointmentTimestamp,
  hasValidAppointmentDate,
  isDoctorProfileComplete,
  parseDoctorBio
} from "../utils/display";

type AppointmentCategory = "today" | "upcoming" | "past" | "completed" | "cancelled";

const appointmentCategories: Array<{ key: AppointmentCategory; label: string }> = [
  { key: "today", label: "Today" },
  { key: "upcoming", label: "Upcoming" },
  { key: "past", label: "Past" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" }
];

const isToday = (dateValue: string): boolean => {
  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return false;
  }

  const now = new Date();

  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
};

const sortNearestFirst = (items: Appointment[]): Appointment[] => {
  return [...items].sort((a, b) => {
    const firstTime = getAppointmentTimestamp(a.appointmentAt);
    const secondTime = getAppointmentTimestamp(b.appointmentAt);

    if (Number.isNaN(firstTime)) {
      return 1;
    }

    if (Number.isNaN(secondTime)) {
      return -1;
    }

    return firstTime - secondTime;
  });
};

const sortNewestFirst = (items: Appointment[]): Appointment[] => {
  return [...items].sort((a, b) => {
    const firstTime = getAppointmentTimestamp(a.appointmentAt);
    const secondTime = getAppointmentTimestamp(b.appointmentAt);

    if (Number.isNaN(firstTime)) {
      return 1;
    }

    if (Number.isNaN(secondTime)) {
      return -1;
    }

    return secondTime - firstTime;
  });
};

function DoctorDashboard() {
  const [profile, setProfile] = useState<DoctorProfile | null>(null);
  const [activeCategory, setActiveCategory] = useState<AppointmentCategory>("today");
  const [profileError, setProfileError] = useState("");
  const {
    appointments,
    error: appointmentsError,
    isLoading,
    isRefreshing,
    lastRefreshedAt,
    refreshAppointments
  } = useDoctorAppointments({
    enableFocusRefresh: true,
    enablePolling: true,
    notifyOnChanges: true,
    pollIntervalMs: 15000
  });

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      try {
        const doctorProfile = await doctorApi.getMyProfile();

        if (!isMounted) {
          return;
        }

        setProfile(doctorProfile);
      } catch (caughtError) {
        if (isMounted) {
          setProfileError(caughtError instanceof Error ? caughtError.message : "Unable to load profile");
        }
      }
    };

    void loadProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  const appointmentGroups = useMemo(() => {
    const activeNow = lastRefreshedAt;
    const activeAppointments = appointments.filter((appointment) => appointment.status !== "cancelled");

    return {
      today: sortNearestFirst(
        activeAppointments.filter((appointment) => isToday(appointment.appointmentAt))
      ),
      upcoming: sortNearestFirst(
        activeAppointments.filter((appointment) => {
          const appointmentTime = getAppointmentTimestamp(appointment.appointmentAt);
          return (
            hasValidAppointmentDate(appointment.appointmentAt) &&
            appointmentTime > activeNow &&
            !isToday(appointment.appointmentAt) &&
            appointment.status !== "completed"
          );
        })
      ),
      past: sortNewestFirst(
        activeAppointments.filter((appointment) => {
          const appointmentTime = getAppointmentTimestamp(appointment.appointmentAt);
          return (
            hasValidAppointmentDate(appointment.appointmentAt) &&
            appointmentTime < activeNow &&
            !isToday(appointment.appointmentAt)
          );
        })
      ),
      completed: sortNewestFirst(
        appointments.filter((appointment) => appointment.status === "completed")
      ),
      cancelled: sortNewestFirst(
        appointments.filter((appointment) => appointment.status === "cancelled")
      )
    };
  }, [appointments, lastRefreshedAt]);

  const visibleAppointments = appointmentGroups[activeCategory];
  const activeCategoryLabel =
    appointmentCategories.find((category) => category.key === activeCategory)?.label || "Appointments";
  const parsedProfileBio = parseDoctorBio(profile?.bio);
  const isProfileComplete = isDoctorProfileComplete(profile);
  const error = profileError || appointmentsError;

  return (
    <main style={{ padding: 24 }}>
      <h1>Doctor Dashboard</h1>
      {error && <p role="alert">{error}</p>}

      <section>
        <h2>Profile</h2>
        <p>{profile ? `${profile.name} - ${profile.specialization}` : "Loading profile..."}</p>
        {profile && !isProfileComplete && (
          <div style={{ border: "1px solid #ddd", padding: 12, marginTop: 12 }}>
            <p>
              Your doctor profile is missing patient-facing details. Complete it so patients can see
              your bio, specialization, experience, and contact information.
            </p>
            <Link to="/doctor/profile">Complete Profile</Link>
          </div>
        )}
        {profile && isProfileComplete && (
          <p>
            Bio: {parsedProfileBio.bio || "Not provided"}{" "}
            <Link to="/doctor/profile">Edit Profile</Link>
          </p>
        )}
      </section>

      <section>
        <div
          style={{
            alignItems: "center",
            display: "flex",
            flexWrap: "wrap",
            gap: 12,
            justifyContent: "space-between"
          }}
        >
          <h2>Appointment Timeline</h2>
          <button
            type="button"
            disabled={isRefreshing}
            onClick={() => void refreshAppointments({ detectChanges: true, showRefreshing: true })}
          >
            {isRefreshing ? "Refreshing..." : "Refresh Appointments"}
          </button>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
          {appointmentCategories.map((category) => (
            <button
              key={category.key}
              type="button"
              onClick={() => setActiveCategory(category.key)}
              aria-pressed={activeCategory === category.key}
              style={{
                fontWeight: activeCategory === category.key ? 700 : 400
              }}
            >
              {category.label} ({appointmentGroups[category.key].length})
            </button>
          ))}
        </div>
        <h3>{activeCategoryLabel} Appointments</h3>
        {isLoading && <p>Loading appointments...</p>}
        {!isLoading && visibleAppointments.length === 0 && <p>No appointments found.</p>}
        <div style={{ display: "grid", gap: 12 }}>
          {visibleAppointments.map((appointment) => (
            <article key={appointment._id} style={{ border: "1px solid #ddd", padding: 12 }}>
              <h4 style={{ marginBottom: 8 }}>{getAppointmentCounterparty(appointment, "doctor")}</h4>
              <p>Date/time: {formatAppointmentDate(appointment.appointmentAt)}</p>
              <p>Time: {formatAppointmentTime(appointment.appointmentAt)}</p>
              <p>Specialization: {profile?.specialization || "Specialization unavailable"}</p>
              <p>Patient: {getAppointmentCounterparty(appointment, "doctor")}</p>
              <p>Status: {appointment.status}</p>
              <p style={{ color: "#666", fontSize: 12 }}>Appointment ID: {appointment._id}</p>
              <Link to={`/doctor/appointments/${appointment._id}`}>View Details</Link>
            </article>
          ))}
        </div>
      </section>

      <section>
        <h2>Appointment Summary</h2>
        <p>{appointments.length} total appointment(s)</p>
      </section>
    </main>
  );
}

export default DoctorDashboard;
