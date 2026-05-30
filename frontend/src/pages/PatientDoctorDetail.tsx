import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import toast from "react-hot-toast";
import { Link, useLocation, useParams } from "react-router-dom";
import { appointmentApi } from "../api/appointment.api";
import { doctorApi } from "../api/doctor.api";
import type { DoctorLike, DoctorProfile } from "../types";
import { getDoctorLikeId, getDoctorName, getDoctorUserId, parseDoctorBio } from "../utils/display";
import { emitRefreshEvent } from "../utils/refreshEvents";

interface LocationState {
  doctor?: DoctorLike | DoctorProfile | string | null;
}

function PatientDoctorDetail() {
  const { id } = useParams();
  const location = useLocation();
  const embeddedDoctor = (location.state as LocationState | null)?.doctor;
  const [doctor, setDoctor] = useState<DoctorLike | DoctorProfile | null>(
    typeof embeddedDoctor === "string" ? null : embeddedDoctor || null
  );
  const [appointmentAt, setAppointmentAt] = useState("");
  const [reason, setReason] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadDoctor = async () => {
      if (embeddedDoctor && typeof embeddedDoctor !== "string") {
        setDoctor(embeddedDoctor);
        setIsLoading(false);
        return;
      }

      if (!id) {
        setError("");
        setIsLoading(false);
        return;
      }

      try {
        const doctorProfile = await doctorApi.getById(id);

        if (isMounted) {
          setDoctor(doctorProfile);
        }
      } catch (caughtError) {
        if (isMounted) {
          const message = caughtError instanceof Error ? caughtError.message : "Unable to load doctor";

          if (message.toLowerCase().includes("doctor profile not found")) {
            setError("");
          } else {
            setError(message);
          }
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadDoctor();

    return () => {
      isMounted = false;
    };
  }, [embeddedDoctor, id]);

  const handleBook = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!doctor) {
      setError("Doctor profile is not loaded yet.");
      toast.error("Doctor profile is not loaded yet.");
      return;
    }

    if (!appointmentAt) {
      setError("Appointment date and time is required.");
      toast.error("Appointment date and time is required.");
      return;
    }

    const doctorId =
      "user" in doctor && doctor.user ? getDoctorUserId(doctor as DoctorProfile) : getDoctorLikeId(doctor);

    if (!doctorId) {
      setError("This doctor cannot be booked because doctor information is unavailable.");
      toast.error("This doctor cannot be booked because doctor information is unavailable.");
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading("Booking appointment...");

    try {
      await appointmentApi.book({
        doctorId,
        appointmentAt: new Date(appointmentAt).toISOString(),
        reason: reason || undefined
      });
      setAppointmentAt("");
      setReason("");
      toast.success("New appointment booked", { id: toastId });
      emitRefreshEvent("appointments");
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : "Unable to book appointment";
      setError(message);
      toast.error(message, { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main style={{ padding: 24 }}>
      <p>
        <Link to="/patient/doctors">Back to doctors</Link>
      </p>
      <h1>Doctor Details</h1>
      {error && <p role="alert">{error}</p>}
      {isLoading && <p>Loading doctor...</p>}
      {!isLoading && !doctor && !error && <p>Doctor information unavailable for this appointment</p>}

      {doctor && (
        <>
          <section>
            <h2>{getDoctorName(doctor)}</h2>
            <p>Specialization: {doctor.specialization || "Specialization unavailable"}</p>
            <p>Bio: {parseDoctorBio(doctor.bio).bio || "Not provided"}</p>
            <p>Experience: {parseDoctorBio(doctor.bio).experience || "Not provided"}</p>
            <p>Contact: {doctor.contactNumber || "Not provided"}</p>
          </section>

          <section>
            <h2>Book Appointment</h2>
            <form onSubmit={handleBook} style={{ display: "grid", gap: 12, maxWidth: 480 }}>
              <label>
                Date and time
                <input
                  required
                  type="datetime-local"
                  value={appointmentAt}
                  onChange={(event) => setAppointmentAt(event.target.value)}
                />
              </label>
              <label>
                Reason
                <textarea value={reason} onChange={(event) => setReason(event.target.value)} />
              </label>
              <button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Booking..." : "Book appointment"}
              </button>
            </form>
          </section>
        </>
      )}
    </main>
  );
}

export default PatientDoctorDetail;
