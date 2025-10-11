import { Router } from "express";
import passport from "passport";
import * as friendshipsController from "../controllers/friendshipsController.js";

const friendshipsRouter = Router();

friendshipsRouter.use(passport.authenticate("jwt", { session: false }));

friendshipsRouter.post("/", friendshipsController.createFriendRequest);

export default friendshipsRouter;
