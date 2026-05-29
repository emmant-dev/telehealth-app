import { Types } from "mongoose";
import { Notification } from "../models/Notification";
import { ApiError } from "../utils/ApiError";

interface CreateNotificationInput {
  user: Types.ObjectId | string;
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
}

export const createNotification = async (input: CreateNotificationInput) => {
  return Notification.create(input);
};

export const getMyNotifications = async (userId: string) => {
  return Notification.find({ user: userId }).sort({ createdAt: -1 });
};

export const updateMyNotificationReadState = async (
  userId: string,
  notificationId: string,
  read: boolean
) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, user: userId },
    { read },
    { new: true }
  );

  if (!notification) {
    throw new ApiError(404, "Notification not found");
  }

  return notification;
};
