import type { Appointment, DoctorLike, DoctorProfile, MedicalRecord, UserReference } from "../types";

const doctorExperiencePattern = /\[Experience\]\s*([\s\S]*?)\s*\[Bio\]\s*([\s\S]*)/i;

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
  const appointmentDate = new Date(appointmentAt);

  if (Number.isNaN(appointmentDate.getTime())) {
    return "Date unavailable";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(appointmentDate);
};

export const formatAppointmentTime = (appointmentAt: string): string => {
  const appointmentDate = new Date(appointmentAt);

  if (Number.isNaN(appointmentDate.getTime())) {
    return "Time unavailable";
  }

  return new Intl.DateTimeFormat(undefined, {
    timeStyle: "short"
  }).format(appointmentDate);
};

export const getAppointmentTimestamp = (appointmentAt?: string): number => {
  if (!appointmentAt) {
    return Number.NaN;
  }

  return new Date(appointmentAt).getTime();
};

export const hasValidAppointmentDate = (appointmentAt?: string): boolean => {
  return !Number.isNaN(getAppointmentTimestamp(appointmentAt));
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

export const parseDoctorBio = (rawBio?: string): { bio: string; experience: string } => {
  if (!rawBio?.trim()) {
    return { bio: "", experience: "" };
  }

  const structuredBio = rawBio.match(doctorExperiencePattern);

  if (!structuredBio) {
    return { bio: rawBio.trim(), experience: "" };
  }

  return {
    experience: structuredBio[1]?.trim() || "",
    bio: structuredBio[2]?.trim() || ""
  };
};

export const formatDoctorBio = (bio: string, experience: string): string | undefined => {
  const trimmedBio = bio.trim();
  const trimmedExperience = experience.trim();

  if (!trimmedBio && !trimmedExperience) {
    return undefined;
  }

  if (!trimmedExperience) {
    return trimmedBio;
  }

  return `[Experience]\n${trimmedExperience}\n\n[Bio]\n${trimmedBio || "Not provided"}`;
};

export const isDoctorProfileComplete = (doctor?: Pick<DoctorProfile, "name" | "bio" | "specialization"> | null): boolean => {
  if (!doctor) {
    return false;
  }

  const parsedBio = parseDoctorBio(doctor.bio);

  return Boolean(doctor.name?.trim() && doctor.specialization?.trim() && parsedBio.bio.trim());
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
