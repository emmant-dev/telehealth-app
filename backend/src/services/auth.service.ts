import { DoctorProfile } from "../models/DoctorProfile";
import { PatientProfile } from "../models/PatientProfile";
import { User } from "../models/User";
import { UserRole } from "../types/auth";
import { ApiError } from "../utils/ApiError";
import { signToken } from "../utils/jwt";
import { sanitizeUser } from "../utils/sanitize";

interface RegisterInput {
  email: string;
  password: string;
  role: UserRole;
  name: string;
  specialization?: string;
}

interface LoginInput {
  email: string;
  password: string;
}

export const registerUser = async (input: RegisterInput) => {
  const existingUser = await User.findOne({ email: input.email.toLowerCase() });

  if (existingUser) {
    throw new ApiError(409, "Email is already registered");
  }

  if (input.role === "doctor" && !input.specialization) {
    throw new ApiError(400, "Specialization is required for doctor registration");
  }

  const user = await User.create({
    email: input.email,
    password: input.password,
    role: input.role
  });

  if (input.role === "patient") {
    await PatientProfile.create({
      user: user._id,
      name: input.name
    });
  }

  if (input.role === "doctor") {
    await DoctorProfile.create({
      user: user._id,
      name: input.name,
      specialization: input.specialization
    });
  }

  const token = signToken({ id: user._id.toString(), role: user.role });

  return {
    user: sanitizeUser(user),
    token
  };
};

export const loginUser = async (input: LoginInput) => {
  const user = await User.findOne({ email: input.email.toLowerCase() }).select("+password");

  if (!user || !(await user.comparePassword(input.password))) {
    throw new ApiError(401, "Invalid email or password");
  }

  const token = signToken({ id: user._id.toString(), role: user.role });

  return {
    user: sanitizeUser(user),
    token
  };
};
