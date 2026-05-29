import { Appointment } from "../models/Appointment";
import { DoctorProfile } from "../models/DoctorProfile";
import { ApiError } from "../utils/ApiError";

export const getDoctors = async (query: { specialization?: string; search?: string }) => {
  const filters: Record<string, unknown> = {};

  if (query.specialization) {
    filters.specialization = { $regex: query.specialization, $options: "i" };
  }

  if (query.search) {
    filters.$or = [
      { name: { $regex: query.search, $options: "i" } },
      { specialization: { $regex: query.search, $options: "i" } }
    ];
  }

  return DoctorProfile.find(filters).populate("user", "email role").sort({ name: 1 });
};

export const getDoctorById = async (doctorUserId: string) => {
  const profile = await DoctorProfile.findOne({ user: doctorUserId }).populate("user", "email role");

  if (!profile) {
    throw new ApiError(404, "Doctor profile not found");
  }

  return profile;
};

export const getMyDoctorProfile = async (userId: string) => {
  const profile = await DoctorProfile.findOne({ user: userId });

  if (!profile) {
    throw new ApiError(404, "Doctor profile not found");
  }

  return profile;
};

export const updateMyDoctorProfile = async (userId: string, updates: object) => {
  const profile = await DoctorProfile.findOneAndUpdate({ user: userId }, updates, {
    new: true,
    runValidators: true
  });

  if (!profile) {
    throw new ApiError(404, "Doctor profile not found");
  }

  return profile;
};

export const getMyDoctorAppointments = async (userId: string) => {
  return Appointment.find({ doctor: userId })
    .populate("patient", "email role")
    .sort({ appointmentAt: -1 });
};
