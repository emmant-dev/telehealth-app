export type UserRole = "patient" | "doctor";

export interface AuthUser {
  _id?: string;
  id: string;
  email?: string;
  role: UserRole;
}

export interface UserReference {
  _id?: string;
  id?: string;
  name?: string;
  email?: string;
  role?: UserRole;
  birthday?: string;
  weightKg?: number;
  heightCm?: number;
  contactNumber?: string;
  basicMedicalHistory?: string;
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
  user: UserReference | string;
  name: string;
  bio?: string;
  specialization: string;
  profilePictureUrl?: string;
  contactNumber?: string;
  availableSlots: string[];
  unavailableSlots: string[];
}

export type DoctorLike = Partial<DoctorProfile> & UserReference;

export interface Appointment {
  _id: string;
  patient: UserReference | string;
  doctor: UserReference | string;
  doctorId?: string;
  doctor_id?: string;
  DoctorData?: DoctorLike;
  LabData?: {
    doctor_id?: string;
    DoctorData?: DoctorLike;
    doctor?: DoctorLike;
  };
  appointmentAt: string;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  reason?: string;
  meetingLink?: string;
  sessionUrl?: string;
}

export interface MedicalRecord {
  _id: string;
  patient: UserReference | string;
  doctor: UserReference | string;
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
