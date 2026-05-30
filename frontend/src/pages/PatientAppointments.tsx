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
import { ui } from "../utils/ui";

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
    <main className={ui.page}>
      <h1 className={ui.heading1}>My Appointments</h1>
      {error && <p className={ui.alert} role="alert">{error}</p>}
      {isLoading && <p className={ui.muted}>Loading appointments...</p>}
      {!isLoading && appointments.length === 0 && <p className={ui.status}>No appointments yet.</p>}
      <div className={ui.grid}>
        {appointments.map((appointment) => {
          const consultationLink = getConsultationLink(appointment._id);
          const embeddedDoctor = getEmbeddedDoctor(appointment);
          const doctorId = getAppointmentDoctorId(appointment);
          const isMutable =
            appointment.status === "pending" || appointment.status === "confirmed";

          return (
            <article key={appointment._id} className={ui.card}>
              <h2 className={ui.heading2}>{formatAppointmentDate(appointment.appointmentAt)}</h2>
              <p className={ui.muted}>Doctor: {getAppointmentCounterparty(appointment, "patient")}</p>
              {doctorId ? (
                <p>
                  <Link className={ui.linkButton} to={`/patient/doctors/${doctorId}`} state={{ doctor: embeddedDoctor }}>
                    View Details
                  </Link>
                </p>
              ) : (
                <p className={ui.muted}>Doctor information unavailable for this appointment</p>
              )}
              <p className={ui.muted}>Status: {appointment.status}</p>
              {appointment.reason && <p className={ui.muted}>Reason: {appointment.reason}</p>}

              <div className="mt-3">
                <a className={ui.button} href={consultationLink} target="_blank" rel="noreferrer">
                  Join Consultation
                </a>
              </div>

              <div className="mt-3 grid w-full gap-2 sm:max-w-[480px]">
                <button
                  className={ui.button}
                  type="button"
                  disabled={!isMutable || mutatingAppointmentId === appointment._id}
                  onClick={() => void handleCancel(appointment._id)}
                >
                  Cancel Appointment
                </button>
                <form className={ui.form} onSubmit={(event) => void handleReschedule(event, appointment._id)}>
                  <label className={ui.label}>
                    New date and time
                    <input
                      className={ui.input}
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
                    className={ui.button}
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
