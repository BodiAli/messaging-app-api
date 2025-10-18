import { Router } from "express";
import * as authController from "../controllers/authController.js";
import validateBody from "../middlewares/validateBody.js";
import { UserSignUpSchema, UserLogInSchema } from "../lib/zodSchemas.js";

const authRouter = Router();

authRouter.get("/guest", authController.logInAsGuest);
authRouter.post("/sign-up", validateBody(UserSignUpSchema), authController.createUser);
authRouter.post("/log-in", validateBody(UserLogInSchema), authController.authenticateUser);

export default authRouter;
