import { Router } from "express";
import * as authController from "../controllers/authController.js";
import validateBody from "../middleware/validateBody.js";
import { UserSignUpSchema, UserLogInSchema } from "../lib/zodSchemas.js";

const authRouter = Router();

authRouter.post("/sign-up", validateBody(UserSignUpSchema), authController.createUser);
authRouter.post("/log-in", validateBody(UserLogInSchema), authController.authenticateUser);

export default authRouter;
