import { Router } from "express";
import passport from "passport";
import * as notificationsController from "../controllers/notificationsController.js";

const notificationsRouter = Router();

notificationsRouter.use(passport.authenticate("jwt", { session: false }));

notificationsRouter.get("/me", notificationsController.getUserNotifications);

export default notificationsRouter;
