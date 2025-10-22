import type { Request, Response } from "express";
import * as groupModel from "../models/groupModel.js";

export async function getUserGroups(req: Request, res: Response) {
  if (!req.user) {
    throw new Error("User not found");
  }

  const userGroups = await groupModel.getUserGroups(req.user.id);

  res.json({ groups: userGroups });
}

export async function createGroup(req: Request<object, object, { groupName: string }>, res: Response) {
  if (!req.user) {
    throw new Error("User not found");
  }

  const { groupName } = req.body;

  const createdGroup = await groupModel.createGroup(groupName, req.user.id);

  res.status(201).json({ group: createdGroup });
}

export async function getGroupWithMembers(req: Request<{ groupId: string }>, res: Response) {
  if (!req.user) {
    throw new Error("User not found");
  }

  const { groupId } = req.params;

  const groupWithMembers = await groupModel.getGroupWithMembers(groupId);

  if (!groupWithMembers) {
    res.status(404).json({
      errors: [
        { message: "Group not found! it may have been moved, deleted or it might have never existed." },
      ],
    });

    return;
  }

  res.status(200).json({ group: groupWithMembers });
}
