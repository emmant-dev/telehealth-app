import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { appointmentApi } from "../api/appointment.api";
import { doctorApi } from "../api/doctor.api";
import { medicalApi } from "../api/medical.api";
import type { Appointment, MedicalRecord, UserReference } from "../types";
import {
  formatAppointmentDate,
  getAppointmentPatientId,
  getConsultationLink,
  getRecordAppointmentId,
  getRecordPatientId,
  getUserLabel,
  parseMedicalNotes
} from "../utils/display";

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
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadAppointment = async () => {
      if (!id) {
        setError("Appointment id is missing.");
        setIsLoading(false);
        return;
      }

      try {
        const [appointments, records] = await Promise.all([
          doctorApi.getAppointments(),
          medicalApi.listMine()
        ]);
        const foundAppointment = appointments.find((item) => item._id === id);
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
  }, [id]);

  const updateStatus = async (status: Appointment["status"]) => {
    if (!appointment) {
      return;
    }

    setError("");
    setSuccessMessage("");
    setIsUpdatingStatus(true);

    try {
      const updatedAppointment = await appointmentApi.updateStatus(appointment._id, status);
      setAppointment((current) =>
        current ? { ...current, status: updatedAppointment.status } : updatedAppointment
      );
      setSuccessMessage(`Appointment marked as ${status}.`);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to update status");
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
      return;
    }

    setError("");
    setSuccessMessage("");
    setIsSavingNotes(true);

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
      setSuccessMessage("Consultation notes saved.");
      setNotes("");
      setDiagnosis("");
      setPrescription("");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to save notes");
    } finally {
      setIsSavingNotes(false);
    }
  };

  const patientInfo = appointment ? getPatientInfo(appointment) : null;
  const jitsiLink = appointment ? getConsultationLink(appointment._id) : "";
  const parsedSavedRecord = parseMedicalNotes(medicalRecord?.notes);

  return (
    <main style={{ padding: 24 }}>
      <p>
        <Link to="/doctor/dashboard">Back to dashboard</Link>
      </p>
      <h1>Appointment Detail</h1>
      {error && <p role="alert">{error}</p>}
      {successMessage && <p role="status">{successMessage}</p>}
      {isLoading && <p>Loading appointment...</p>}

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
            {patientHistory.length === 0 && <p>No medical history available.</p>}
            <div style={{ display: "grid", gap: 12 }}>
              {patientHistory.map((record) => {
                const parsedRecord = parseMedicalNotes(record.notes);

                return (
                  <article key={record._id} style={{ border: "1px solid #ddd", padding: 12 }}>
                    <p>Appointment: {getRecordAppointmentId(record)}</p>
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
