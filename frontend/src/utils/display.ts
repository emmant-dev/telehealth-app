import type { Appointment, DoctorLike, DoctorProfile, MedicalRecord, UserReference } from "../types";

export const getUserId = (user: UserReference | string): string => {
  if (typeof user === "string") {
    return user;
  }

  return user.id || user._id || "";
};

export const getUserLabel = (user: UserReference | string): string => {
  if (typeof user === "string") {
    return user;
  }

  return user.name || user.email || user.id || user._id || "Unknown user";
};

export const formatAppointmentDate = (appointmentAt: string): string => {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(appointmentAt));
};

export const getDoctorUserId = (doctor: DoctorProfile): string => {
  return getUserId(doctor.user);
};

export const getDoctorLikeId = (doctor?: DoctorLike | DoctorProfile | UserReference | string | null): string => {
  if (!doctor) {
    return "";
  }

  if (typeof doctor === "string") {
    return doctor;
  }

  if ("user" in doctor && doctor.user) {
    return getUserId(doctor.user);
  }

  return ("id" in doctor ? doctor.id : undefined) || doctor._id || "";
};

export const getEmbeddedDoctor = (appointment: Appointment): DoctorLike | UserReference | string | null => {
  return (
    appointment.DoctorData ||
    appointment.LabData?.DoctorData ||
    appointment.LabData?.doctor ||
    appointment.doctor ||
    null
  );
};

export const getAppointmentDoctorId = (appointment: Appointment): string => {
  return (
    appointment.DoctorData?.id ||
    getDoctorLikeId(appointment.DoctorData) ||
    getDoctorLikeId(appointment.doctor) ||
    appointment.doctorId ||
    appointment.doctor_id ||
    appointment.LabData?.doctor_id ||
    getDoctorLikeId(appointment.LabData?.DoctorData) ||
    getDoctorLikeId(appointment.LabData?.doctor)
  );
};

export const getDoctorName = (doctor?: DoctorLike | UserReference | string | null): string => {
  if (!doctor) {
    return "Doctor information unavailable";
  }

  if (typeof doctor === "string") {
    return doctor;
  }

  return doctor.name || doctor.email || doctor.id || doctor._id || "Doctor information unavailable";
};

export const getAppointmentCounterparty = (
  appointment: Appointment,
  viewerRole: "patient" | "doctor"
): string => {
  return viewerRole === "patient"
    ? getDoctorName(getEmbeddedDoctor(appointment))
    : getUserLabel(appointment.patient);
};

export const getRecordAppointmentId = (record: MedicalRecord): string => {
  return typeof record.appointment === "string" ? record.appointment : record.appointment._id;
};

export const getRecordPatientId = (record: MedicalRecord): string => {
  if (typeof record.patient === "string") {
    return record.patient;
  }

  return record.patient.id || record.patient._id || "";
};

export const getAppointmentPatientId = (appointment: Appointment): string => {
  if (typeof appointment.patient === "string") {
    return appointment.patient;
  }

  return appointment.patient.id || appointment.patient._id || "";
};

export const getConsultationLink = (appointmentId: string): string => {
  return `https://meet.jit.si/telehealth-${appointmentId}`;
};

export const parseMedicalNotes = (
  rawNotes?: string
): { diagnosis: string; notes: string } => {
  if (!rawNotes?.trim()) {
    return { diagnosis: "Not provided", notes: "No consultation notes available." };
  }

  const diagnosisMatch = rawNotes.match(/Diagnosis:\s*([\s\S]*?)(?:\n\s*\nNotes:|$)/i);
  const notesMatch = rawNotes.match(/Notes:\s*([\s\S]*)/i);

  return {
    diagnosis: diagnosisMatch?.[1]?.trim() || "Not provided",
    notes: notesMatch?.[1]?.trim() || rawNotes.trim()
  };
};
