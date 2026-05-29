import { Appointment, AppointmentStatus } from "../models/Appointment";
import { DoctorProfile } from "../models/DoctorProfile";
import { User } from "../models/User";
import { ApiError } from "../utils/ApiError";
import { createNotification } from "./notification.service";

const activeStatuses: AppointmentStatus[] = ["pending", "confirmed"];

export const bookAppointment = async (
  patientId: string,
  input: { doctorId: string; appointmentAt: Date; reason?: string }
) => {
  const doctor = await User.findOne({ _id: input.doctorId, role: "doctor" });

  if (!doctor) {
    throw new ApiError(404, "Doctor not found");
  }

  const doctorProfile = await DoctorProfile.findOne({ user: doctor._id });

  if (!doctorProfile) {
    throw new ApiError(404, "Doctor profile not found");
  }

  const unavailable = doctorProfile.unavailableSlots.some(
    (slot) => slot.getTime() === input.appointmentAt.getTime()
  );

  if (unavailable) {
    throw new ApiError(409, "Selected time slot is unavailable");
  }

  const existingAppointment = await Appointment.findOne({
    doctor: input.doctorId,
    appointmentAt: input.appointmentAt,
    status: { $in: activeStatuses }
  });

  if (existingAppointment) {
    throw new ApiError(409, "Selected time slot is already booked");
  }

  try {
    const appointment = await Appointment.create({
      patient: patientId,
      doctor: input.doctorId,
      appointmentAt: input.appointmentAt,
      reason: input.reason,
      status: "pending"
    });

    await createNotification({
      user: input.doctorId,
      title: "New appointment request",
      message: "A patient booked a consultation with you.",
      metadata: { appointmentId: appointment._id.toString() }
    });

    return appointment;
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === 11000
    ) {
      throw new ApiError(409, "Selected time slot is already booked");
    }

    throw error;
  }
};

export const getMyAppointments = async (userId: string, role: string) => {
  const filter = role === "doctor" ? { doctor: userId } : { patient: userId };

  return Appointment.find(filter)
    .populate("patient", "email role")
    .populate("doctor", "email role")
    .sort({ appointmentAt: -1 });
};

export const cancelAppointment = async (userId: string, appointmentId: string) => {
  const appointment = await Appointment.findOne({
    _id: appointmentId,
    $or: [{ patient: userId }, { doctor: userId }]
  });

  if (!appointment) {
    throw new ApiError(404, "Appointment not found");
  }

  if (appointment.status === "cancelled") {
    throw new ApiError(400, "Appointment is already cancelled");
  }

  if (appointment.status === "completed") {
    throw new ApiError(400, "Completed appointments cannot be cancelled");
  }

  appointment.status = "cancelled";
  appointment.cancelledBy = appointment.patient.equals(userId)
    ? appointment.patient
    : appointment.doctor;
  await appointment.save();

  const recipient = appointment.patient.equals(userId) ? appointment.doctor : appointment.patient;
  await createNotification({
    user: recipient,
    title: "Appointment cancelled",
    message: "An appointment has been cancelled.",
    metadata: { appointmentId: appointment._id.toString() }
  });

  return appointment;
};

export const rescheduleAppointment = async (
  userId: string,
  appointmentId: string,
  appointmentAt: Date
) => {
  const appointment = await Appointment.findOne({
    _id: appointmentId,
    $or: [{ patient: userId }, { doctor: userId }]
  });

  if (!appointment) {
    throw new ApiError(404, "Appointment not found");
  }

  if (!activeStatuses.includes(appointment.status)) {
    throw new ApiError(400, "Only pending or confirmed appointments can be rescheduled");
  }

  const existingAppointment = await Appointment.findOne({
    _id: { $ne: appointment._id },
    doctor: appointment.doctor,
    appointmentAt,
    status: { $in: activeStatuses }
  });

  if (existingAppointment) {
    throw new ApiError(409, "Selected time slot is already booked");
  }

  appointment.appointmentAt = appointmentAt;
  appointment.status = "pending";
  await appointment.save();

  const recipient = appointment.patient.equals(userId) ? appointment.doctor : appointment.patient;
  await createNotification({
    user: recipient,
    title: "Appointment rescheduled",
    message: "An appointment has been rescheduled.",
    metadata: { appointmentId: appointment._id.toString() }
  });

  return appointment;
};

export const updateAppointmentStatus = async (
  doctorId: string,
  appointmentId: string,
  status: AppointmentStatus
) => {
  const appointment = await Appointment.findOne({ _id: appointmentId, doctor: doctorId });

  if (!appointment) {
    throw new ApiError(404, "Appointment not found");
  }

  appointment.status = status;
  await appointment.save();

  await createNotification({
    user: appointment.patient,
    title: "Appointment updated",
    message: `Your appointment status is now ${status}.`,
    metadata: { appointmentId: appointment._id.toString() }
  });

  return appointment;
};
