import { Document, Schema, Types, model } from "mongoose";

export type AppointmentStatus = "pending" | "confirmed" | "cancelled" | "completed";

export interface IAppointment extends Document {
  patient: Types.ObjectId;
  doctor: Types.ObjectId;
  appointmentAt: Date;
  status: AppointmentStatus;
  reason?: string;
  meetingLink?: string;
  cancelledBy?: Types.ObjectId;
}

const appointmentSchema = new Schema<IAppointment>(
  {
    patient: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    doctor: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    appointmentAt: {
      type: Date,
      required: true
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "completed"],
      default: "pending",
      required: true
    },
    reason: String,
    meetingLink: String,
    cancelledBy: {
      type: Schema.Types.ObjectId,
      ref: "User"
    }
  },
  {
    timestamps: true
  }
);

appointmentSchema.index(
  { doctor: 1, appointmentAt: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: { $in: ["pending", "confirmed"] }
    }
  }
);
appointmentSchema.index({ patient: 1, appointmentAt: -1 });
appointmentSchema.index({ doctor: 1, appointmentAt: -1 });

export const Appointment = model<IAppointment>("Appointment", appointmentSchema);
