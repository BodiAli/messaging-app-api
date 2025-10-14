import type { Request, Response } from "express";
import * as friendshipModel from "../models/friendshipModel.js";
import * as messageModel from "../models/messageModel.js";

export async function getUserFriends(req: Request, res: Response) {
  if (!req.user) {
    throw new Error("User not found");
  }

  const friends = await friendshipModel.getUserFriends(req.user.id);

  res.status(200).json({ friends });
}

export async function getTwoUsersMessages(req: Request<{ id: string }>, res: Response) {
  if (!req.user) {
    throw new Error("User not found");
  }

  const { id } = req.params;

  const messages = await messageModel.getMessagesBetweenTwoUsers(req.user.id, id);

  res.json({ messages });
}
