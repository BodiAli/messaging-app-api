import { Router, type RequestHandler } from "express";
import * as authController from "../controllers/authController.js";
import validateBody from "../middlewares/validateBody.js";
import { UserSignUpSchema, UserLogInSchema } from "../lib/zodSchemas.js";
import passport from "passport";

const authRouter = Router();

authRouter.get("/guest", authController.logInAsGuest);
authRouter.get(
  "/get-user",
  passport.authenticate("jwt", { session: false }) as RequestHandler,
  authController.getUser
);
authRouter.post("/sign-up", validateBody(UserSignUpSchema), authController.createUser);
authRouter.post("/log-in", validateBody(UserLogInSchema), authController.authenticateUser);

export default authRouter;
