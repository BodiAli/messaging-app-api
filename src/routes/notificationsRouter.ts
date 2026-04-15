import { Router } from "express";
import passport from "passport";
import * as notificationsController from "../controllers/notificationsController.js";
import updateLastSeen from "../middlewares/updateLastSeen.js";

const notificationsRouter = Router();

notificationsRouter.use(passport.authenticate("jwt", { session: false }));
notificationsRouter.use(updateLastSeen);

notificationsRouter.get("/me", notificationsController.getUserNotifications);

export default notificationsRouter;
