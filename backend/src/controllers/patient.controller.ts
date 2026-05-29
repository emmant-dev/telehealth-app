import { Request, Response } from "express";
import {
  getMyPatientAppointments,
  getMyPatientProfile,
  updateMyPatientProfile
} from "../services/patient.service";

export const getProfile = async (req: Request, res: Response): Promise<void> => {
  const profile = await getMyPatientProfile(req.user!.id);
  res.status(200).json({ success: true, data: { profile } });
};

export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  const profile = await updateMyPatientProfile(req.user!.id, req.body);
  res.status(200).json({ success: true, data: { profile } });
};

export const getAppointments = async (req: Request, res: Response): Promise<void> => {
  const appointments = await getMyPatientAppointments(req.user!.id);
  res.status(200).json({ success: true, data: { appointments } });
};
