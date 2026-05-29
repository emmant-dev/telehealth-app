import { Request, Response } from "express";
import {
  bookAppointment,
  cancelAppointment,
  getMyAppointments,
  rescheduleAppointment,
  updateAppointmentStatus
} from "../services/appointment.service";

export const createAppointment = async (req: Request, res: Response): Promise<void> => {
  const appointment = await bookAppointment(req.user!.id, req.body);
  res.status(201).json({ success: true, data: { appointment } });
};

export const listMyAppointments = async (req: Request, res: Response): Promise<void> => {
  const appointments = await getMyAppointments(req.user!.id, req.user!.role);
  res.status(200).json({ success: true, data: { appointments } });
};

export const cancelMyAppointment = async (req: Request, res: Response): Promise<void> => {
  const appointment = await cancelAppointment(req.user!.id, String(req.params.id));
  res.status(200).json({ success: true, data: { appointment } });
};

export const rescheduleMyAppointment = async (req: Request, res: Response): Promise<void> => {
  const appointment = await rescheduleAppointment(
    req.user!.id,
    String(req.params.id),
    req.body.appointmentAt
  );
  res.status(200).json({ success: true, data: { appointment } });
};

export const setAppointmentStatus = async (req: Request, res: Response): Promise<void> => {
  const appointment = await updateAppointmentStatus(
    req.user!.id,
    String(req.params.id),
    req.body.status
  );
  res.status(200).json({ success: true, data: { appointment } });
};
