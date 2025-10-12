import { Router } from "express";
import passport from "passport";
import * as friendshipsController from "../controllers/friendshipsController.js";

const friendshipsRouter = Router();

friendshipsRouter.use(passport.authenticate("jwt", { session: false }));

friendshipsRouter.post("/", friendshipsController.createFriendRequest);

friendshipsRouter.patch("/:id", friendshipsController.updateFriendRequest);
friendshipsRouter.delete("/:id", friendshipsController.deleteFriendRequest);

export default friendshipsRouter;
