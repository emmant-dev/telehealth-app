import { Router } from "express";
import {
  createRecord,
  getMyRecord,
  listMyRecords,
  updateRecord
} from "../controllers/medicalRecord.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { authorizeRoles } from "../middlewares/role.middleware";
import { validate } from "../middlewares/validate.middleware";
import { asyncHandler } from "../utils/asyncHandler";
import { mongoIdParamSchema } from "../validators/common.validators";
import {
  createMedicalRecordSchema,
  updateMedicalRecordSchema
} from "../validators/medicalRecord.validators";

const router = Router();

router.use(authenticate);

router.get("/", asyncHandler(listMyRecords));
router.get("/:id", validate(mongoIdParamSchema), asyncHandler(getMyRecord));
router.post(
  "/",
  authorizeRoles("doctor"),
  validate(createMedicalRecordSchema),
  asyncHandler(createRecord)
);
router.patch(
  "/:id",
  authorizeRoles("doctor"),
  validate(mongoIdParamSchema.merge(updateMedicalRecordSchema)),
  asyncHandler(updateRecord)
);

export default router;
