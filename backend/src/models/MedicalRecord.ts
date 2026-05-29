import { Document, Schema, Types, model } from "mongoose";

export interface IMedicalRecord extends Document {
  patient: Types.ObjectId;
  doctor: Types.ObjectId;
  appointment: Types.ObjectId;
  notes: string;
  prescription?: string;
}

const medicalRecordSchema = new Schema<IMedicalRecord>(
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
    appointment: {
      type: Schema.Types.ObjectId,
      ref: "Appointment",
      required: true,
      unique: true
    },
    notes: {
      type: String,
      required: true
    },
    prescription: String
  },
  {
    timestamps: true
  }
);

medicalRecordSchema.index({ patient: 1, createdAt: -1 });
medicalRecordSchema.index({ doctor: 1, createdAt: -1 });

export const MedicalRecord = model<IMedicalRecord>("MedicalRecord", medicalRecordSchema);
