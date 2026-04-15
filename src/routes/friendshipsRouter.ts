import { Router } from "express";
import passport from "passport";
import unauthorizeGuest from "../middlewares/unauthorizeGuest.js";
import * as friendshipsController from "../controllers/friendshipsController.js";
import updateLastSeen from "../middlewares/updateLastSeen.js";

const friendshipsRouter = Router();

friendshipsRouter.use(passport.authenticate("jwt", { session: false }));
friendshipsRouter.use(unauthorizeGuest);
friendshipsRouter.use(updateLastSeen);

friendshipsRouter.post("/", friendshipsController.createFriendRequest);

friendshipsRouter.patch("/:id", friendshipsController.updateFriendRequest);
friendshipsRouter.delete("/:id", friendshipsController.deleteFriendRequest);

export default friendshipsRouter;
