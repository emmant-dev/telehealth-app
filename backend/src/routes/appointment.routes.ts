import { Router } from "express";
import {
  cancelMyAppointment,
  createAppointment,
  listMyAppointments,
  rescheduleMyAppointment,
  setAppointmentStatus
} from "../controllers/appointment.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { authorizeRoles } from "../middlewares/role.middleware";
import { validate } from "../middlewares/validate.middleware";
import { asyncHandler } from "../utils/asyncHandler";
import { bookAppointmentSchema, rescheduleAppointmentSchema, updateAppointmentStatusSchema } from "../validators/appointment.validators";
import { mongoIdParamSchema } from "../validators/common.validators";

const router = Router();

router.use(authenticate);

router.get("/", asyncHandler(listMyAppointments));
router.post("/", authorizeRoles("patient"), validate(bookAppointmentSchema), asyncHandler(createAppointment));
router.patch(
  "/:id/cancel",
  validate(mongoIdParamSchema),
  asyncHandler(cancelMyAppointment)
);
router.patch(
  "/:id/reschedule",
  validate(mongoIdParamSchema.merge(rescheduleAppointmentSchema)),
  asyncHandler(rescheduleMyAppointment)
);
router.patch(
  "/:id/status",
  authorizeRoles("doctor"),
  validate(mongoIdParamSchema.merge(updateAppointmentStatusSchema)),
  asyncHandler(setAppointmentStatus)
);

export default router;
