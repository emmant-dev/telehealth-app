import { Request, Response } from "express";
import {
  createMedicalRecord,
  getMyMedicalRecordById,
  getMyMedicalRecords,
  updateMedicalRecord
} from "../services/medicalRecord.service";

export const createRecord = async (req: Request, res: Response): Promise<void> => {
  const record = await createMedicalRecord(req.user!.id, req.body);
  res.status(201).json({ success: true, data: { record } });
};

export const listMyRecords = async (req: Request, res: Response): Promise<void> => {
  const records = await getMyMedicalRecords(req.user!.id, req.user!.role);
  res.status(200).json({ success: true, data: { records } });
};

export const getMyRecord = async (req: Request, res: Response): Promise<void> => {
  const record = await getMyMedicalRecordById(req.user!.id, req.user!.role, String(req.params.id));
  res.status(200).json({ success: true, data: { record } });
};

export const updateRecord = async (req: Request, res: Response): Promise<void> => {
  const record = await updateMedicalRecord(req.user!.id, String(req.params.id), req.body);
  res.status(200).json({ success: true, data: { record } });
};
