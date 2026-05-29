import { apiClient } from "./client";
import type { ApiEnvelope, Appointment, DoctorProfile } from "../types";

export const doctorApi = {
  async list(params?: { specialization?: string; search?: string }): Promise<DoctorProfile[]> {
    const response = await apiClient.get<ApiEnvelope<{ doctors: DoctorProfile[] }>>(
      "/api/doctors",
      { params }
    );
    return response.data.data.doctors;
  },

  async getById(id: string): Promise<DoctorProfile> {
    const response = await apiClient.get<ApiEnvelope<{ doctor: DoctorProfile }>>(
      `/api/doctors/${id}`
    );
    return response.data.data.doctor;
  },

  async getMyProfile(): Promise<DoctorProfile> {
    const response = await apiClient.get<ApiEnvelope<{ profile: DoctorProfile }>>(
      "/api/doctors/me/profile"
    );
    return response.data.data.profile;
  },

  async updateMyProfile(payload: Partial<DoctorProfile>): Promise<DoctorProfile> {
    const response = await apiClient.patch<ApiEnvelope<{ profile: DoctorProfile }>>(
      "/api/doctors/me/profile",
      payload
    );
    return response.data.data.profile;
  },

  async getAppointments(): Promise<Appointment[]> {
    const response = await apiClient.get<ApiEnvelope<{ appointments: Appointment[] }>>(
      "/api/doctors/me/appointments"
    );
    return response.data.data.appointments;
  }
};
