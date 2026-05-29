import { apiClient } from "./client";
import type { ApiEnvelope, MedicalRecord } from "../types";

export const medicalApi = {
  async listMine(): Promise<MedicalRecord[]> {
    const response = await apiClient.get<ApiEnvelope<{ records: MedicalRecord[] }>>(
      "/api/medical-records"
    );
    return response.data.data.records;
  },

  async getById(id: string): Promise<MedicalRecord> {
    const response = await apiClient.get<ApiEnvelope<{ record: MedicalRecord }>>(
      `/api/medical-records/${id}`
    );
    return response.data.data.record;
  },

  async create(payload: {
    appointmentId: string;
    notes: string;
    prescription?: string;
  }): Promise<MedicalRecord> {
    const response = await apiClient.post<ApiEnvelope<{ record: MedicalRecord }>>(
      "/api/medical-records",
      payload
    );
    return response.data.data.record;
  },

  async update(
    id: string,
    payload: { notes?: string; prescription?: string }
  ): Promise<MedicalRecord> {
    const response = await apiClient.patch<ApiEnvelope<{ record: MedicalRecord }>>(
      `/api/medical-records/${id}`,
      payload
    );
    return response.data.data.record;
  }
};
