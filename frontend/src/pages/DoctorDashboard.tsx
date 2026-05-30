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
import { ui } from "../utils/ui";

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
    <main className={ui.page}>
      <h1 className={ui.heading1}>Doctor Dashboard</h1>
      {error && <p className={ui.alert} role="alert">{error}</p>}

      <section className={ui.section}>
        <h2 className={ui.heading2}>Profile</h2>
        <p className={ui.muted}>{profile ? `${profile.name} - ${profile.specialization}` : "Loading profile..."}</p>
        {profile && !isProfileComplete && (
          <div className={`${ui.card} mt-3`}>
            <p className={ui.muted}>
              Your doctor profile is missing patient-facing details. Complete it so patients can see
              your bio, specialization, experience, and contact information.
            </p>
            <Link className={ui.linkButton} to="/doctor/profile">Complete Profile</Link>
          </div>
        )}
        {profile && isProfileComplete && (
          <p className={ui.muted}>
            Bio: {parsedProfileBio.bio || "Not provided"}{" "}
            <Link className={ui.linkButton} to="/doctor/profile">Edit Profile</Link>
          </p>
        )}
      </section>

      <section className={ui.section}>
        <div className={ui.flexBetween}>
          <h2 className={ui.heading2}>Appointment Timeline</h2>
          <button
            className={ui.button}
            type="button"
            disabled={isRefreshing}
            onClick={() => void refreshAppointments({ detectChanges: true, showRefreshing: true })}
          >
            {isRefreshing ? "Refreshing..." : "Refresh Appointments"}
          </button>
        </div>
        <div className={`${ui.flexWrap} mb-4`}>
          {appointmentCategories.map((category) => (
            <button
              className={activeCategory === category.key ? ui.button : ui.secondaryButton}
              key={category.key}
              type="button"
              onClick={() => setActiveCategory(category.key)}
              aria-pressed={activeCategory === category.key}
            >
              {category.label} ({appointmentGroups[category.key].length})
            </button>
          ))}
        </div>
        <h3 className={ui.heading3}>{activeCategoryLabel} Appointments</h3>
        {isLoading && <p className={ui.muted}>Loading appointments...</p>}
        {!isLoading && visibleAppointments.length === 0 && <p className={ui.status}>No appointments found.</p>}
        <div className={ui.grid}>
          {visibleAppointments.map((appointment) => (
            <article key={appointment._id} className={ui.card}>
              <h4 className={ui.heading3}>{getAppointmentCounterparty(appointment, "doctor")}</h4>
              <p className={ui.muted}>Date/time: {formatAppointmentDate(appointment.appointmentAt)}</p>
              <p className={ui.muted}>Time: {formatAppointmentTime(appointment.appointmentAt)}</p>
              <p className={ui.muted}>Specialization: {profile?.specialization || "Specialization unavailable"}</p>
              <p className={ui.muted}>Patient: {getAppointmentCounterparty(appointment, "doctor")}</p>
              <p className={ui.muted}>Status: {appointment.status}</p>
              <p className={ui.smallMuted}>Appointment ID: {appointment._id}</p>
              <Link className={ui.linkButton} to={`/doctor/appointments/${appointment._id}`}>View Details</Link>
            </article>
          ))}
        </div>
      </section>

      <section className={ui.section}>
        <h2 className={ui.heading2}>Appointment Summary</h2>
        <p className={ui.muted}>{appointments.length} total appointment(s)</p>
      </section>
    </main>
  );
}

export default DoctorDashboard;
