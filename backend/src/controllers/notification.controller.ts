import { Request, Response } from "express";
import {
  getMyNotifications,
  updateMyNotificationReadState
} from "../services/notification.service";

export const listMyNotifications = async (req: Request, res: Response): Promise<void> => {
  const notifications = await getMyNotifications(req.user!.id);
  res.status(200).json({ success: true, data: { notifications } });
};

export const updateNotificationReadState = async (req: Request, res: Response): Promise<void> => {
  const notification = await updateMyNotificationReadState(
    req.user!.id,
    String(req.params.id),
    req.body.read
  );

  res.status(200).json({ success: true, data: { notification } });
};
