import { Document, Schema, Types, model } from "mongoose";

export interface IDoctorProfile extends Document {
  user: Types.ObjectId;
  name: string;
  bio?: string;
  specialization: string;
  profilePictureUrl?: string;
  contactNumber?: string;
  availableSlots: Date[];
  unavailableSlots: Date[];
}

const doctorProfileSchema = new Schema<IDoctorProfile>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    bio: String,
    specialization: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    profilePictureUrl: String,
    contactNumber: String,
    availableSlots: {
      type: [Date],
      default: []
    },
    unavailableSlots: {
      type: [Date],
      default: []
    }
  },
  {
    timestamps: true
  }
);

export const DoctorProfile = model<IDoctorProfile>("DoctorProfile", doctorProfileSchema);
