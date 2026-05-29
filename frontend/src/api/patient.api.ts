import { apiClient } from "./client";
import type { ApiEnvelope, Appointment, PatientProfile } from "../types";

export const patientApi = {
  async getMe(): Promise<PatientProfile> {
    const response = await apiClient.get<ApiEnvelope<{ profile: PatientProfile }>>(
      "/api/patients/me"
    );
    return response.data.data.profile;
  },

  async updateMe(payload: Partial<PatientProfile>): Promise<PatientProfile> {
    const response = await apiClient.patch<ApiEnvelope<{ profile: PatientProfile }>>(
      "/api/patients/me",
      payload
    );
    return response.data.data.profile;
  },

  async getAppointments(): Promise<Appointment[]> {
    const response = await apiClient.get<ApiEnvelope<{ appointments: Appointment[] }>>(
      "/api/patients/me/appointments"
    );
    return response.data.data.appointments;
  }
};
