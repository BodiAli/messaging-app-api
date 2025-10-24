import { Router } from "express";
import passport from "passport";
import upload from "../config/multerConfig.js";
import validateBody from "../middlewares/validateBody.js";
import validateFile from "../middlewares/validateFile.js";
import * as usersController from "../controllers/usersController.js";
import { FileSchema, MessageContentSchema } from "../lib/zodSchemas.js";
import groupsRouter from "./groupsRouter.js";

const usersRouter = Router();

usersRouter.use(passport.authenticate("jwt", { session: false }));

usersRouter.get("/me/friends", usersController.getUserFriends);
usersRouter.get("/me/anonymous", usersController.getNonFriendsOfUser);

usersRouter
  .route("/:id/messages")
  .get(usersController.getTwoUsersMessages)
  .post(
    upload.single("messageImage"),
    validateFile(FileSchema),
    validateBody(MessageContentSchema),
    usersController.createMessage
  );

usersRouter.use("/me/groups", groupsRouter);

export default usersRouter;
