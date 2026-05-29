import { Router } from "express";
import { login, me, register } from "../controllers/auth.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { asyncHandler } from "../utils/asyncHandler";
import { loginSchema, registerSchema } from "../validators/auth.validators";

const router = Router();

router.post("/register", validate(registerSchema), asyncHandler(register));
router.post("/login", validate(loginSchema), asyncHandler(login));
router.get("/me", authenticate, asyncHandler(me));

export default router;
