import { Router } from "express";
import {
  getAppointments,
  getProfile,
  updateProfile
} from "../controllers/patient.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { authorizeRoles } from "../middlewares/role.middleware";
import { validate } from "../middlewares/validate.middleware";
import { asyncHandler } from "../utils/asyncHandler";
import { updatePatientProfileSchema } from "../validators/patient.validators";

const router = Router();

router.use(authenticate, authorizeRoles("patient"));

router.get("/me", asyncHandler(getProfile));
router.patch("/me", validate(updatePatientProfileSchema), asyncHandler(updateProfile));
router.get("/me/appointments", asyncHandler(getAppointments));

export default router;
