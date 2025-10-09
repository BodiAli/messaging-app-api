import { Router } from "express";
import * as authController from "../controllers/authController.js";

const authRouter = Router();

authRouter.post("/sign-up", authController.createUser);

export default authRouter;
