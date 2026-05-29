import { Document, Schema, Types, model } from "mongoose";

export interface IPatientProfile extends Document {
  user: Types.ObjectId;
  name: string;
  birthday?: Date;
  weightKg?: number;
  heightCm?: number;
  profilePictureUrl?: string;
  contactNumber?: string;
  address?: string;
  basicMedicalHistory?: string;
}

const patientProfileSchema = new Schema<IPatientProfile>(
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
    birthday: Date,
    weightKg: {
      type: Number,
      min: 0
    },
    heightCm: {
      type: Number,
      min: 0
    },
    profilePictureUrl: String,
    contactNumber: String,
    address: String,
    basicMedicalHistory: String
  },
  {
    timestamps: true
  }
);

export const PatientProfile = model<IPatientProfile>("PatientProfile", patientProfileSchema);
