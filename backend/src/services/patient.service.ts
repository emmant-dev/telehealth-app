import { Appointment } from "../models/Appointment";
import { PatientProfile } from "../models/PatientProfile";
import { ApiError } from "../utils/ApiError";

export const getMyPatientProfile = async (userId: string) => {
  const profile = await PatientProfile.findOne({ user: userId });

  if (!profile) {
    throw new ApiError(404, "Patient profile not found");
  }

  return profile;
};

export const updateMyPatientProfile = async (userId: string, updates: object) => {
  const profile = await PatientProfile.findOneAndUpdate({ user: userId }, updates, {
    new: true,
    runValidators: true
  });

  if (!profile) {
    throw new ApiError(404, "Patient profile not found");
  }

  return profile;
};

export const getMyPatientAppointments = async (userId: string) => {
  return Appointment.find({ patient: userId })
    .populate("doctor", "email role")
    .sort({ appointmentAt: -1 });
};
