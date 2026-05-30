import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import toast from "react-hot-toast";
import { Link, useParams } from "react-router-dom";
import { appointmentApi } from "../api/appointment.api";
import { medicalApi } from "../api/medical.api";
import { useDoctorAppointments } from "../hooks/useDoctorAppointments";
import type { Appointment, MedicalRecord, UserReference } from "../types";
import {
  formatAppointmentDate,
  getAppointmentPatientId,
  getAppointmentTimestamp,
  getConsultationLink,
  getRecordAppointmentId,
  getRecordPatientId,
  getUserLabel,
  hasValidAppointmentDate,
  parseMedicalNotes
} from "../utils/display";
import { emitRefreshEvent } from "../utils/refreshEvents";

const getPatientInfo = (appointment: Appointment): UserReference | null => {
  return typeof appointment.patient === "string" ? null : appointment.patient;
};

const calculateAge = (birthday?: string): string => {
  if (!birthday) {
    return "Not available";
  }

  const birthDate = new Date(birthday);
  const now = new Date();
  let age = now.getFullYear() - birthDate.getFullYear();
  const monthDelta = now.getMonth() - birthDate.getMonth();

  if (monthDelta < 0 || (monthDelta === 0 && now.getDate() < birthDate.getDate())) {
    age -= 1;
  }

  return `${age}`;
};

function DoctorAppointmentDetail() {
  const { id } = useParams();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [medicalRecord, setMedicalRecord] = useState<MedicalRecord | null>(null);
  const [patientHistory, setPatientHistory] = useState<MedicalRecord[]>([]);
  const [notes, setNotes] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [prescription, setPrescription] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [error, setError] = useState("");
  const {
    appointments: doctorAppointments,
    error: appointmentRefreshError,
    isLoading: isLoadingAppointments,
    refreshAppointments
  } = useDoctorAppointments({
    enableFocusRefresh: true,
    enablePolling: true,
    notifyOnChanges: true,
    pollIntervalMs: 15000
  });

  useEffect(() => {
    let isMounted = true;

    const loadAppointment = async () => {
      if (!id) {
        setError("Appointment id is missing.");
        setIsLoading(false);
        return;
      }

      if (isLoadingAppointments) {
        return;
      }

      try {
        const records = await medicalApi.listMine();
        const foundAppointment = doctorAppointments.find((item) => item._id === id);
        const foundRecord = records.find((record) => getRecordAppointmentId(record) === id);
        const patientId = foundAppointment ? getAppointmentPatientId(foundAppointment) : "";
        const matchingHistory = patientId
          ? records.filter((record) => getRecordPatientId(record) === patientId)
          : [];

        if (!isMounted) {
          return;
        }

        if (!foundAppointment) {
          setError("Appointment not found.");
        }

        setAppointment(foundAppointment || null);
        setMedicalRecord(foundRecord || null);
        setPatientHistory(matchingHistory);
      } catch (caughtError) {
        if (isMounted) {
          setError(caughtError instanceof Error ? caughtError.message : "Unable to load appointment");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadAppointment();

    return () => {
      isMounted = false;
    };
  }, [doctorAppointments, id, isLoadingAppointments]);

  const updateStatus = async (status: Appointment["status"]) => {
    if (!appointment) {
      return;
    }

    setError("");
    setIsUpdatingStatus(true);
    const toastId = toast.loading("Updating appointment...");

    try {
      const updatedAppointment = await appointmentApi.updateStatus(appointment._id, status);
      setAppointment((current) =>
        current ? { ...current, status: updatedAppointment.status } : updatedAppointment
      );
      await refreshAppointments({ detectChanges: false });
      let statusMessage = "Appointment cancelled";

      if (status === "confirmed") {
        statusMessage = "Appointment confirmed by doctor";
      }

      if (status === "completed") {
        statusMessage = "Consultation completed";
      }

      toast(statusMessage, { id: toastId });
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : "Unable to update status";
      setError(message);
      toast.error(message, { id: toastId });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const saveNotes = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!appointment) {
      return;
    }

    const trimmedNotes = notes.trim();
    const trimmedDiagnosis = diagnosis.trim();

    if (!trimmedNotes && !trimmedDiagnosis) {
      setError("Add consultation notes or diagnosis before saving.");
      toast.error("Add consultation notes or diagnosis before saving.");
      return;
    }

    setError("");
    setIsSavingNotes(true);
    const toastId = toast.loading("Saving medical record...");

    const combinedNotes = [
      trimmedDiagnosis ? `Diagnosis: ${trimmedDiagnosis}` : "",
      trimmedNotes ? `Notes: ${trimmedNotes}` : ""
    ]
      .filter(Boolean)
      .join("\n\n");

    try {
      const savedRecord = medicalRecord
        ? await medicalApi.update(medicalRecord._id, {
            notes: combinedNotes,
            prescription: prescription.trim() || undefined
          })
        : await medicalApi.create({
            appointmentId: appointment._id,
            notes: combinedNotes,
            prescription: prescription.trim() || undefined
          });
      setMedicalRecord(savedRecord);
      setPatientHistory((current) => {
        const exists = current.some((record) => record._id === savedRecord._id);

        if (exists) {
          return current.map((record) => (record._id === savedRecord._id ? savedRecord : record));
        }

        return [savedRecord, ...current];
      });
      setNotes("");
      setDiagnosis("");
      setPrescription("");
      toast.success("Medical record updated", { id: toastId });
      emitRefreshEvent("medical-records");
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : "Unable to save notes";
      setError(message);
      toast.error(message, { id: toastId });
    } finally {
      setIsSavingNotes(false);
    }
  };

  const patientInfo = appointment ? getPatientInfo(appointment) : null;
  const jitsiLink = appointment ? getConsultationLink(appointment._id) : "";
  const parsedSavedRecord = parseMedicalNotes(medicalRecord?.notes);
  const sortedPatientHistory = useMemo(() => {
    return [...patientHistory].sort((firstRecord, secondRecord) => {
      const firstAppointment =
        typeof firstRecord.appointment === "string"
          ? doctorAppointments.find((item) => item._id === firstRecord.appointment)
          : firstRecord.appointment;
      const secondAppointment =
        typeof secondRecord.appointment === "string"
          ? doctorAppointments.find((item) => item._id === secondRecord.appointment)
          : secondRecord.appointment;
      const firstTime = getAppointmentTimestamp(firstAppointment?.appointmentAt);
      const secondTime = getAppointmentTimestamp(secondAppointment?.appointmentAt);

      if (Number.isNaN(firstTime)) {
        return 1;
      }

      if (Number.isNaN(secondTime)) {
        return -1;
      }

      return secondTime - firstTime;
    });
  }, [doctorAppointments, patientHistory]);

  return (
    <main style={{ padding: 24 }}>
      <p>
        <Link to="/doctor/dashboard">Back to dashboard</Link>
      </p>
      <h1>Appointment Detail</h1>
      {(error || appointmentRefreshError) && <p role="alert">{error || appointmentRefreshError}</p>}
      {(isLoading || isLoadingAppointments) && <p>Loading appointment...</p>}

      {appointment && (
        <>
          <section>
            <h2>Appointment</h2>
            <p>Date/time: {formatAppointmentDate(appointment.appointmentAt)}</p>
            <p>Status: {appointment.status}</p>
            {appointment.reason && <p>Reason: {appointment.reason}</p>}
            <p>
              <a href={jitsiLink} target="_blank" rel="noreferrer">
                Join Consultation
              </a>
            </p>
          </section>

          <section>
            <h2>Patient Profile</h2>
            <p>Name: {getUserLabel(appointment.patient)}</p>
            {patientInfo ? (
              <>
                <p>Email: {patientInfo.email || "Not available"}</p>
                <p>Age: {calculateAge(patientInfo.birthday)}</p>
                <p>Birthday: {patientInfo.birthday || "Not available"}</p>
                <p>Height: {patientInfo.heightCm ? `${patientInfo.heightCm} cm` : "Not available"}</p>
                <p>Weight: {patientInfo.weightKg ? `${patientInfo.weightKg} kg` : "Not available"}</p>
                <p>Medical history: {patientInfo.basicMedicalHistory || "Not available"}</p>
              </>
            ) : (
              <p>Basic patient profile data is not available from this appointment response.</p>
            )}
          </section>

          <section>
            <h2>Status Management</h2>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                type="button"
                disabled={isUpdatingStatus || appointment.status !== "pending"}
                onClick={() => void updateStatus("confirmed")}
              >
                Confirm Appointment
              </button>
              <button
                type="button"
                disabled={isUpdatingStatus || appointment.status !== "confirmed"}
                onClick={() => void updateStatus("completed")}
              >
                Complete Appointment
              </button>
              <button
                type="button"
                disabled={isUpdatingStatus || appointment.status === "completed"}
                onClick={() => void updateStatus("cancelled")}
              >
                Cancel Appointment
              </button>
            </div>
          </section>

          <section>
            <h2>Consultation Notes</h2>
            <article style={{ border: "1px solid #ddd", padding: 12, marginBottom: 12 }}>
              <h3>Saved Medical Record</h3>
              {medicalRecord ? (
                <>
                  <h4>Diagnosis</h4>
                  <p style={{ whiteSpace: "pre-wrap" }}>{parsedSavedRecord.diagnosis}</p>
                  <h4>Consultation Notes</h4>
                  <p style={{ whiteSpace: "pre-wrap" }}>{parsedSavedRecord.notes}</p>
                  <h4>Prescription</h4>
                  <p style={{ whiteSpace: "pre-wrap" }}>
                    {medicalRecord.prescription || "No prescription provided."}
                  </p>
                </>
              ) : (
                <p>No consultation notes saved for this appointment yet.</p>
              )}
            </article>
            <form onSubmit={saveNotes} style={{ display: "grid", gap: 12, maxWidth: 640 }}>
              <label>
                Diagnosis
                <textarea value={diagnosis} onChange={(event) => setDiagnosis(event.target.value)} />
              </label>
              <label>
                Consultation notes
                <textarea value={notes} onChange={(event) => setNotes(event.target.value)} />
              </label>
              <label>
                Prescription
                <textarea
                  value={prescription}
                  onChange={(event) => setPrescription(event.target.value)}
                />
              </label>
              <button type="submit" disabled={isSavingNotes}>
                {isSavingNotes ? "Saving..." : medicalRecord ? "Update Notes" : "Save Notes"}
              </button>
            </form>
          </section>

          <section>
            <h2>Patient Medical History</h2>
            {sortedPatientHistory.length === 0 && <p>No medical history available.</p>}
            <div style={{ display: "grid", gap: 12 }}>
              {sortedPatientHistory.map((record) => {
                const parsedRecord = parseMedicalNotes(record.notes);
                const historyAppointment =
                  typeof record.appointment === "string"
                    ? doctorAppointments.find((item) => item._id === record.appointment)
                    : record.appointment;
                const appointmentLabel = hasValidAppointmentDate(historyAppointment?.appointmentAt)
                  ? formatAppointmentDate(historyAppointment?.appointmentAt || "")
                  : "Appointment date unavailable";

                return (
                  <article key={record._id} style={{ border: "1px solid #ddd", padding: 12 }}>
                    <h3>Consultation on {appointmentLabel}</h3>
                    <p>Appointment date/time: {appointmentLabel}</p>
                    <p style={{ color: "#666", fontSize: 12 }}>
                      Appointment ID: {getRecordAppointmentId(record)}
                    </p>
                    <h3>Diagnosis</h3>
                    <p style={{ whiteSpace: "pre-wrap" }}>{parsedRecord.diagnosis}</p>
                    <h3>Consultation Notes</h3>
                    <p style={{ whiteSpace: "pre-wrap" }}>{parsedRecord.notes}</p>
                    <h3>Prescription</h3>
                    <p style={{ whiteSpace: "pre-wrap" }}>
                      {record.prescription || "No prescription provided."}
                    </p>
                  </article>
                );
              })}
            </div>
          </section>
        </>
      )}
    </main>
  );
}

export default DoctorAppointmentDetail;
