import type { NextFunction, Request, Response } from "express";
import * as groupModel from "../models/groupModel.js";
import CustomHttpStatusError from "../errors/httpStatusError.js";
import { Prisma } from "../generated/prisma/index.js";

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

export async function createGroupInvite(
  req: Request<{ groupId: string }, object, { userIds: string[] }>,
  res: Response,
  next: NextFunction
) {
  if (!req.user) {
    throw new Error("User not found");
  }

  const { groupId } = req.params;
  const { userIds } = req.body;

  try {
    await groupModel.sendGroupInviteToUsers(groupId, req.user.id, userIds);
  } catch (error) {
    if (error instanceof CustomHttpStatusError) {
      res.status(error.code).json({ errors: [{ message: error.message }] });
      return;
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2003") {
        res.status(422).json({ errors: [{ message: "Invalid user ID." }] });
        return;
      }
    }

    next(error);
    return;
  }

  res.sendStatus(201);
}

export async function deleteGroupInvite(
  req: Request<{ groupId: string }>,
  res: Response,
  next: NextFunction
) {
  if (!req.user) {
    throw new Error("User not found");
  }

  const { groupId } = req.params;

  try {
    await groupModel.rejectGroupInvite(groupId, req.user.id);
  } catch (error) {
    if (error instanceof CustomHttpStatusError) {
      res.status(error.code).json({ errors: [{ message: error.message }] });
      return;
    }

    next(error);
    return;
  }

  res.sendStatus(204);
}

export async function acceptGroupInvite(
  req: Request<{ groupId: string }>,
  res: Response,
  next: NextFunction
) {
  if (!req.user) {
    throw new Error("User not found");
  }

  const { groupId } = req.params;

  try {
    await groupModel.acceptGroupInvite(groupId, req.user.id);
  } catch (error) {
    if (error instanceof CustomHttpStatusError) {
      res.status(error.code).json({ errors: [{ message: error.message }] });
      return;
    }

    next(error);
    return;
  }

  res.sendStatus(204);
}

export async function updateGroupName(
  req: Request<{ groupId: string }, object, { groupName: string }>,
  res: Response,
  next: NextFunction
) {
  if (!req.user) {
    throw new Error("User not found");
  }

  const { groupId } = req.params;
  const { groupName } = req.body;

  try {
    const updatedGroup = await groupModel.updateGroupName(groupId, req.user.id, groupName);

    res.status(200).json({ group: updatedGroup });
  } catch (error) {
    if (error instanceof CustomHttpStatusError) {
      res.status(error.code).json({ errors: [{ message: error.message }] });
      return;
    }

    next(error);
  }
}

export async function deleteGroupMember(
  req: Request<{ groupId: string; memberId: string }>,
  res: Response,
  next: NextFunction
) {
  if (!req.user) {
    throw new Error("User not found");
  }

  const { groupId, memberId } = req.params;

  try {
    await groupModel.removeGroupMember(groupId, memberId, req.user.id);
    res.sendStatus(204);
  } catch (error) {
    if (error instanceof CustomHttpStatusError) {
      res.status(error.code).json({ errors: [{ message: error.message }] });
      return;
    }

    next(error);
  }
}

export async function deleteGroup(req: Request<{ groupId: string }>, res: Response, next: NextFunction) {
  if (!req.user) {
    throw new Error("User not found");
  }

  const { groupId } = req.params;

  try {
    await groupModel.deleteGroup(groupId, req.user.id);

    res.sendStatus(204);
  } catch (error) {
    if (error instanceof CustomHttpStatusError) {
      res.status(error.code).json({ errors: [{ message: error.message }] });
      return;
    }
    next(error);
  }
}
