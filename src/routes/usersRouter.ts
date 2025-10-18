import { Router } from "express";
import passport from "passport";
import upload from "../config/multerConfig.js";
import validateBody from "../middlewares/validateBody.js";
import validateFile from "../middlewares/validateFile.js";
import * as usersController from "../controllers/usersController.js";
import { FileSchema, MessageContentSchema } from "../lib/zodSchemas.js";

const usersRouter = Router();

usersRouter.use(passport.authenticate("jwt", { session: false }));

usersRouter.get("/me/friends", usersController.getUserFriends);
usersRouter.get("/:id/messages", usersController.getTwoUsersMessages);

usersRouter.post(
  "/:id/messages",
  upload.single("messageImage"),
  validateFile(FileSchema),
  validateBody(MessageContentSchema),
  usersController.createMessage
);

export default usersRouter;
