import { Router } from "express";
import validateBody from "../middlewares/validateBody.js";
import { GroupSchema, SendGroupInviteToUsers } from "../lib/zodSchemas.js";
import * as groupsController from "../controllers/groupsController.js";

const groupsRouter = Router({ mergeParams: true });

groupsRouter.get("/", groupsController.getUserGroups);

groupsRouter.post("/", validateBody(GroupSchema), groupsController.createGroup);

groupsRouter.get("/:groupId", groupsController.getGroupWithMembers);

groupsRouter.post(
  "/:groupId/notifications",
  validateBody(SendGroupInviteToUsers),
  groupsController.createGroupInvite
);

export default groupsRouter;
