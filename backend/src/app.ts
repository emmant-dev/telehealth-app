import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { env } from "./config/env";
import { errorHandler } from "./middlewares/error.middleware";
import { notFoundHandler } from "./middlewares/notFound.middleware";
import appointmentRoutes from "./routes/appointment.routes";
import authRoutes from "./routes/auth.routes";
import doctorRoutes from "./routes/doctor.routes";
import medicalRecordRoutes from "./routes/medicalRecord.routes";
import notificationRoutes from "./routes/notification.routes";
import patientRoutes from "./routes/patient.routes";

export const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.corsOrigin,
    credentials: true
  })
);
app.use(express.json({ limit: "1mb" }));

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    standardHeaders: true,
    legacyHeaders: false
  })
);

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/medical-records", medicalRecordRoutes);
app.use("/api/notifications", notificationRoutes);

app.use(notFoundHandler);
app.use(errorHandler);
