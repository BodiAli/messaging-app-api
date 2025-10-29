import { Router } from "express";
import validateBody from "../middlewares/validateBody.js";
import { GroupSchema, SendGroupInviteToUsers } from "../lib/zodSchemas.js";
import unauthorizeGuest from "../middlewares/unauthorizeGuest.js";
import * as groupsController from "../controllers/groupsController.js";

const groupsRouter = Router({ mergeParams: true });

groupsRouter
  .route("/")
  .get(groupsController.getUserGroups)
  .post(unauthorizeGuest, validateBody(GroupSchema), groupsController.createGroup);

groupsRouter
  .route("/:groupId")
  .all(unauthorizeGuest)
  .get(groupsController.getGroupWithMembers)
  .patch(validateBody(GroupSchema), groupsController.updateGroupName)
  .delete(groupsController.deleteGroup);

groupsRouter
  .route("/:groupId/notifications")
  .all(unauthorizeGuest)
  .post(validateBody(SendGroupInviteToUsers), groupsController.createGroupInvite)
  .delete(groupsController.deleteGroupInvite)
  .patch(groupsController.acceptGroupInvite);

groupsRouter.delete("/:groupId/members/:memberId", unauthorizeGuest, groupsController.deleteGroupMember);

export default groupsRouter;
