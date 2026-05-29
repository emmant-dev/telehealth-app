import { Document, Schema, Types, model } from "mongoose";

export interface INotification extends Document {
  user: Types.ObjectId;
  title: string;
  message: string;
  read: boolean;
  metadata?: Record<string, unknown>;
}

const notificationSchema = new Schema<INotification>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    title: {
      type: String,
      required: true
    },
    message: {
      type: String,
      required: true
    },
    read: {
      type: Boolean,
      default: false
    },
    metadata: {
      type: Schema.Types.Mixed
    }
  },
  {
    timestamps: true
  }
);

notificationSchema.index({ user: 1, createdAt: -1 });

export const Notification = model<INotification>("Notification", notificationSchema);
