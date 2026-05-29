export type UserRole = "patient" | "doctor";

export interface AuthUser {
  id: string;
  email?: string;
  role: UserRole;
}

export interface AuthResponse {
  user: AuthUser;
  token: string;
}

export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

export interface RegisterPayload {
  email: string;
  password: string;
  role: UserRole;
  name: string;
  specialization?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface PatientProfile {
  _id: string;
  user: string;
  name: string;
  birthday?: string;
  weightKg?: number;
  heightCm?: number;
  profilePictureUrl?: string;
  contactNumber?: string;
  address?: string;
  basicMedicalHistory?: string;
}

export interface DoctorProfile {
  _id: string;
  user: AuthUser | string;
  name: string;
  bio?: string;
  specialization: string;
  profilePictureUrl?: string;
  contactNumber?: string;
  availableSlots: string[];
  unavailableSlots: string[];
}

export interface Appointment {
  _id: string;
  patient: AuthUser | string;
  doctor: AuthUser | string;
  appointmentAt: string;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  reason?: string;
  meetingLink?: string;
}

export interface MedicalRecord {
  _id: string;
  patient: AuthUser | string;
  doctor: AuthUser | string;
  appointment: Appointment | string;
  notes: string;
  prescription?: string;
}

export interface Notification {
  _id: string;
  title: string;
  message: string;
  read: boolean;
  metadata?: Record<string, unknown>;
  createdAt: string;
}
