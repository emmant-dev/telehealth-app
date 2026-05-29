import { Appointment } from "../models/Appointment";
import { MedicalRecord } from "../models/MedicalRecord";
import { ApiError } from "../utils/ApiError";
import { createNotification } from "./notification.service";

export const createMedicalRecord = async (
  doctorId: string,
  input: { appointmentId: string; notes: string; prescription?: string }
) => {
  const appointment = await Appointment.findOne({
    _id: input.appointmentId,
    doctor: doctorId
  });

  if (!appointment) {
    throw new ApiError(404, "Appointment not found");
  }

  const existingRecord = await MedicalRecord.findOne({ appointment: appointment._id });

  if (existingRecord) {
    throw new ApiError(409, "Medical record already exists for this appointment");
  }

  const record = await MedicalRecord.create({
    patient: appointment.patient,
    doctor: appointment.doctor,
    appointment: appointment._id,
    notes: input.notes,
    prescription: input.prescription
  });

  await createNotification({
    user: appointment.patient,
    title: "Medical record available",
    message: "Your doctor added consultation notes or a prescription.",
    metadata: { medicalRecordId: record._id.toString(), appointmentId: appointment._id.toString() }
  });

  return record;
};

export const getMyMedicalRecords = async (userId: string, role: string) => {
  const filter = role === "doctor" ? { doctor: userId } : { patient: userId };

  return MedicalRecord.find(filter)
    .populate("appointment")
    .populate("patient", "email role")
    .populate("doctor", "email role")
    .sort({ createdAt: -1 });
};

export const getMyMedicalRecordById = async (userId: string, role: string, recordId: string) => {
  const filter = role === "doctor" ? { _id: recordId, doctor: userId } : { _id: recordId, patient: userId };
  const record = await MedicalRecord.findOne(filter)
    .populate("appointment")
    .populate("patient", "email role")
    .populate("doctor", "email role");

  if (!record) {
    throw new ApiError(404, "Medical record not found");
  }

  return record;
};

export const updateMedicalRecord = async (
  doctorId: string,
  recordId: string,
  updates: { notes?: string; prescription?: string }
) => {
  const record = await MedicalRecord.findOneAndUpdate(
    { _id: recordId, doctor: doctorId },
    updates,
    { new: true, runValidators: true }
  );

  if (!record) {
    throw new ApiError(404, "Medical record not found");
  }

  return record;
};
