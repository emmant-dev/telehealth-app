import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { appointmentApi } from "../api/appointment.api";
import { patientApi } from "../api/patient.api";
import type { Appointment } from "../types";
import {
  formatAppointmentDate,
  getConsultationLink,
  getAppointmentCounterparty,
  getAppointmentDoctorId,
  getEmbeddedDoctor
} from "../utils/display";
import { emitRefreshEvent, subscribeToRefreshEvents } from "../utils/refreshEvents";

function PatientAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [rescheduleValues, setRescheduleValues] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [mutatingAppointmentId, setMutatingAppointmentId] = useState("");
  const [error, setError] = useState("");

  const loadAppointments = useCallback(async () => {
    setError("");

    try {
      const appointmentList = await patientApi.getAppointments();
      setAppointments(appointmentList);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to load appointments");
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadInitialAppointments = async () => {
      try {
        const appointmentList = await patientApi.getAppointments();

        if (isMounted) {
          setAppointments(appointmentList);
        }
      } catch (caughtError) {
        if (isMounted) {
          setError(caughtError instanceof Error ? caughtError.message : "Unable to load appointments");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadInitialAppointments();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    return subscribeToRefreshEvents((eventType) => {
      if (eventType === "appointments") {
        void loadAppointments();
      }
    });
  }, [loadAppointments]);

  const handleCancel = async (appointmentId: string) => {
    setError("");
    setMutatingAppointmentId(appointmentId);
    const toastId = toast.loading("Cancelling appointment...");

    try {
      await appointmentApi.cancel(appointmentId);
      await loadAppointments();
      toast("Appointment cancelled", { id: toastId });
      emitRefreshEvent("appointments");
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : "Unable to cancel appointment";
      setError(message);
      toast.error(message, { id: toastId });
    } finally {
      setMutatingAppointmentId("");
    }
  };

  const handleReschedule = async (
    event: FormEvent<HTMLFormElement>,
    appointmentId: string
  ) => {
    event.preventDefault();
    setError("");

    const nextDate = rescheduleValues[appointmentId];

    if (!nextDate) {
      setError("Select a new appointment date and time.");
      toast.error("Select a new appointment date and time.");
      return;
    }

    setMutatingAppointmentId(appointmentId);
    const toastId = toast.loading("Rescheduling appointment...");

    try {
      await appointmentApi.reschedule(appointmentId, new Date(nextDate).toISOString());
      setRescheduleValues((current) => ({ ...current, [appointmentId]: "" }));
      await loadAppointments();
      toast.success("Appointment rescheduled", { id: toastId });
      emitRefreshEvent("appointments");
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : "Unable to reschedule appointment";
      setError(message);
      toast.error(message, { id: toastId });
    } finally {
      setMutatingAppointmentId("");
    }
  };

  return (
    <main style={{ padding: 24 }}>
      <h1>My Appointments</h1>
      {error && <p role="alert">{error}</p>}
      {isLoading && <p>Loading appointments...</p>}
      {!isLoading && appointments.length === 0 && <p>No appointments yet.</p>}
      <div style={{ display: "grid", gap: 12 }}>
        {appointments.map((appointment) => {
          const consultationLink = getConsultationLink(appointment._id);
          const embeddedDoctor = getEmbeddedDoctor(appointment);
          const doctorId = getAppointmentDoctorId(appointment);
          const isMutable =
            appointment.status === "pending" || appointment.status === "confirmed";

          return (
            <article key={appointment._id} style={{ border: "1px solid #ddd", padding: 12 }}>
              <h2>{formatAppointmentDate(appointment.appointmentAt)}</h2>
              <p>Doctor: {getAppointmentCounterparty(appointment, "patient")}</p>
              {doctorId ? (
                <p>
                  <Link to={`/patient/doctors/${doctorId}`} state={{ doctor: embeddedDoctor }}>
                    View Details
                  </Link>
                </p>
              ) : (
                <p>Doctor information unavailable for this appointment</p>
              )}
              <p>Status: {appointment.status}</p>
              {appointment.reason && <p>Reason: {appointment.reason}</p>}

              <div>
                <a href={consultationLink} target="_blank" rel="noreferrer">
                  Join Consultation
                </a>
              </div>

              <div style={{ display: "grid", gap: 8, marginTop: 12, maxWidth: 480 }}>
                <button
                  type="button"
                  disabled={!isMutable || mutatingAppointmentId === appointment._id}
                  onClick={() => void handleCancel(appointment._id)}
                >
                  Cancel Appointment
                </button>
                <form onSubmit={(event) => void handleReschedule(event, appointment._id)}>
                  <label>
                    New date and time
                    <input
                      disabled={!isMutable}
                      type="datetime-local"
                      value={rescheduleValues[appointment._id] || ""}
                      onChange={(event) =>
                        setRescheduleValues((current) => ({
                          ...current,
                          [appointment._id]: event.target.value
                        }))
                      }
                    />
                  </label>
                  <button
                    type="submit"
                    disabled={!isMutable || mutatingAppointmentId === appointment._id}
                  >
                    Reschedule Appointment
                  </button>
                </form>
              </div>
            </article>
          );
        })}
      </div>
    </main>
  );
}

export default PatientAppointments;
