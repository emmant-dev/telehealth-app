import { Router } from "express";
import {
  listMyNotifications,
  updateNotificationReadState
} from "../controllers/notification.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { asyncHandler } from "../utils/asyncHandler";
import { mongoIdParamSchema } from "../validators/common.validators";
import { markNotificationReadSchema } from "../validators/notification.validators";

const router = Router();

router.use(authenticate);

router.get("/", asyncHandler(listMyNotifications));
router.patch(
  "/:id",
  validate(mongoIdParamSchema.merge(markNotificationReadSchema)),
  asyncHandler(updateNotificationReadState)
);

export default router;
