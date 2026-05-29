import { Router } from "express";
import {
  getAppointments,
  getDoctor,
  getProfile,
  listDoctors,
  updateProfile
} from "../controllers/doctor.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { authorizeRoles } from "../middlewares/role.middleware";
import { validate } from "../middlewares/validate.middleware";
import { asyncHandler } from "../utils/asyncHandler";
import { mongoIdParamSchema } from "../validators/common.validators";
import { doctorSearchSchema, updateDoctorProfileSchema } from "../validators/doctor.validators";

const router = Router();

router.get("/me/profile", authenticate, authorizeRoles("doctor"), asyncHandler(getProfile));
router.patch(
  "/me/profile",
  authenticate,
  authorizeRoles("doctor"),
  validate(updateDoctorProfileSchema),
  asyncHandler(updateProfile)
);
router.get(
  "/me/appointments",
  authenticate,
  authorizeRoles("doctor"),
  asyncHandler(getAppointments)
);
router.get("/", validate(doctorSearchSchema), asyncHandler(listDoctors));
router.get("/:id", validate(mongoIdParamSchema), asyncHandler(getDoctor));

export default router;
