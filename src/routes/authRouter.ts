import { Router } from "express";
import * as authController from "../controllers/authController.js";

const authRouter = Router();

authRouter.get("/", authController.createUser);

export default authRouter;
