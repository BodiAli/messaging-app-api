import { Router } from "express";
import * as groupsController from "../controllers/groupsController.js";

const groupsRouter = Router({ mergeParams: true });

groupsRouter.get("/groups", groupsController.getUserGroups);

export default groupsRouter;
