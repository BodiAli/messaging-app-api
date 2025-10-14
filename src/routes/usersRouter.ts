import { Router } from "express";
import passport from "passport";
import * as usersController from "../controllers/usersController.js";

const usersRouter = Router();

usersRouter.use(passport.authenticate("jwt", { session: false }));

usersRouter.get("/me/friends", usersController.getUserFriends);
usersRouter.get("/:id/messages", usersController.getTwoUsersMessages);

export default usersRouter;
