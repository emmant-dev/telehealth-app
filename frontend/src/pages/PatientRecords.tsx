import { useCallback, useEffect, useMemo, useState } from "react";
import { medicalApi } from "../api/medical.api";
import { patientApi } from "../api/patient.api";
import type { Appointment, MedicalRecord } from "../types";
import {
  formatAppointmentDate,
  getAppointmentCounterparty,
  getRecordAppointmentId,
  parseMedicalNotes
} from "../utils/display";
import { subscribeToRefreshEvents } from "../utils/refreshEvents";

interface HistoryEntry {
  appointment: Appointment;
  record?: MedicalRecord;
}

function PatientRecords() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [loadedAt] = useState(() => Date.now());

  const loadHistory = useCallback(async () => {
    setError("");

    try {
      const [appointmentList, recordList] = await Promise.all([
        patientApi.getAppointments(),
        medicalApi.listMine()
      ]);

      setAppointments(appointmentList);
      setRecords(recordList);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to load medical history");
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadInitialHistory = async () => {
      try {
        const [appointmentList, recordList] = await Promise.all([
          patientApi.getAppointments(),
          medicalApi.listMine()
        ]);

        if (isMounted) {
          setAppointments(appointmentList);
          setRecords(recordList);
        }
      } catch (caughtError) {
        if (isMounted) {
          setError(caughtError instanceof Error ? caughtError.message : "Unable to load medical history");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadInitialHistory();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    return subscribeToRefreshEvents((eventType) => {
      if (eventType === "appointments" || eventType === "medical-records") {
        void loadHistory();
      }
    });
  }, [loadHistory]);

  const historyEntries = useMemo<HistoryEntry[]>(() => {
    const recordByAppointmentId = new Map(
      records.map((record) => [getRecordAppointmentId(record), record])
    );

    return appointments
      .filter(
        (appointment) =>
          appointment.status === "completed" ||
          new Date(appointment.appointmentAt).getTime() <= loadedAt ||
          recordByAppointmentId.has(appointment._id)
      )
      .sort(
        (a, b) =>
          new Date(b.appointmentAt).getTime() - new Date(a.appointmentAt).getTime()
      )
      .map((appointment) => ({
        appointment,
        record: recordByAppointmentId.get(appointment._id)
      }));
  }, [appointments, loadedAt, records]);

  return (
    <main style={{ padding: 24 }}>
      <h1>Medical History</h1>
      {error && <p role="alert">{error}</p>}
      {isLoading && <p>Loading medical history...</p>}
      {!isLoading && historyEntries.length === 0 && <p>No medical history available.</p>}

      <section style={{ display: "grid", gap: 12 }}>
        {historyEntries.map(({ appointment, record }) => {
          const parsedRecord = parseMedicalNotes(record?.notes);

          return (
            <article key={appointment._id} style={{ border: "1px solid #ddd", padding: 12 }}>
              <h2>{formatAppointmentDate(appointment.appointmentAt)}</h2>
              <p>Doctor: {getAppointmentCounterparty(appointment, "patient")}</p>
              <p>Status: {appointment.status}</p>
              <h3>Diagnosis</h3>
              <p style={{ whiteSpace: "pre-wrap" }}>{parsedRecord.diagnosis}</p>
              <h3>Consultation Notes</h3>
              <p style={{ whiteSpace: "pre-wrap" }}>{parsedRecord.notes}</p>
              <h3>Prescription</h3>
              <p style={{ whiteSpace: "pre-wrap" }}>
                {record?.prescription || "No prescription provided."}
              </p>
            </article>
          );
        })}
      </section>
    </main>
  );
}

export default PatientRecords;
