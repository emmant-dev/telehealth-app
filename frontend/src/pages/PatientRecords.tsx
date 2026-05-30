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
import { ui } from "../utils/ui";

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
    <main className={ui.page}>
      <h1 className={ui.heading1}>Medical History</h1>
      {error && <p className={ui.alert} role="alert">{error}</p>}
      {isLoading && <p className={ui.muted}>Loading medical history...</p>}
      {!isLoading && historyEntries.length === 0 && <p className={ui.status}>No medical history available.</p>}

      <section className={`${ui.section} ${ui.grid}`}>
        {historyEntries.map(({ appointment, record }) => {
          const parsedRecord = parseMedicalNotes(record?.notes);

          return (
            <article key={appointment._id} className={ui.card}>
              <h2 className={ui.heading2}>{formatAppointmentDate(appointment.appointmentAt)}</h2>
              <p className={ui.muted}>Doctor: {getAppointmentCounterparty(appointment, "patient")}</p>
              <p className={ui.muted}>Status: {appointment.status}</p>
              <h3 className={ui.heading3}>Diagnosis</h3>
              <p className={ui.prewrap}>{parsedRecord.diagnosis}</p>
              <h3 className={ui.heading3}>Consultation Notes</h3>
              <p className={ui.prewrap}>{parsedRecord.notes}</p>
              <h3 className={ui.heading3}>Prescription</h3>
              <p className={ui.prewrap}>
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
