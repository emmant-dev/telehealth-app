import { apiClient } from "./client";
import type { ApiEnvelope, Appointment } from "../types";

export const appointmentApi = {
  async listMine(): Promise<Appointment[]> {
    const response = await apiClient.get<ApiEnvelope<{ appointments: Appointment[] }>>(
      "/api/appointments"
    );
    return response.data.data.appointments;
  },

  async book(payload: {
    doctorId: string;
    appointmentAt: string;
    reason?: string;
  }): Promise<Appointment> {
    const response = await apiClient.post<ApiEnvelope<{ appointment: Appointment }>>(
      "/api/appointments",
      payload
    );
    return response.data.data.appointment;
  },

  async cancel(id: string): Promise<Appointment> {
    const response = await apiClient.patch<ApiEnvelope<{ appointment: Appointment }>>(
      `/api/appointments/${id}/cancel`
    );
    return response.data.data.appointment;
  },

  async reschedule(id: string, appointmentAt: string): Promise<Appointment> {
    const response = await apiClient.patch<ApiEnvelope<{ appointment: Appointment }>>(
      `/api/appointments/${id}/reschedule`,
      { appointmentAt }
    );
    return response.data.data.appointment;
  },

  async updateStatus(id: string, status: Appointment["status"]): Promise<Appointment> {
    const response = await apiClient.patch<ApiEnvelope<{ appointment: Appointment }>>(
      `/api/appointments/${id}/status`,
      { status }
    );
    return response.data.data.appointment;
  }
};
