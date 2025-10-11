import { Router, type RequestHandler } from "express";
import passport from "passport";
import * as usersController from "../controllers/usersController.js";

const usersRouter = Router();

usersRouter.use(passport.authenticate("jwt") as RequestHandler);

usersRouter.get("/friends", usersController.getUserFriends);

export default usersRouter;
