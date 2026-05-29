import { Request, Response } from "express";
import {
  getDoctorById,
  getDoctors,
  getMyDoctorAppointments,
  getMyDoctorProfile,
  updateMyDoctorProfile
} from "../services/doctor.service";

export const listDoctors = async (req: Request, res: Response): Promise<void> => {
  const doctors = await getDoctors({
    specialization: req.query.specialization as string | undefined,
    search: req.query.search as string | undefined
  });
  res.status(200).json({ success: true, data: { doctors } });
};

export const getDoctor = async (req: Request, res: Response): Promise<void> => {
  const doctor = await getDoctorById(String(req.params.id));
  res.status(200).json({ success: true, data: { doctor } });
};

export const getProfile = async (req: Request, res: Response): Promise<void> => {
  const profile = await getMyDoctorProfile(req.user!.id);
  res.status(200).json({ success: true, data: { profile } });
};

export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  const profile = await updateMyDoctorProfile(req.user!.id, req.body);
  res.status(200).json({ success: true, data: { profile } });
};

export const getAppointments = async (req: Request, res: Response): Promise<void> => {
  const appointments = await getMyDoctorAppointments(req.user!.id);
  res.status(200).json({ success: true, data: { appointments } });
};
