import type { Request, Response } from "express";
import * as friendshipModel from "../models/friendshipModel.js";
import * as messageModel from "../models/messageModel.js";
import * as userModel from "../models/userModel.js";

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

export async function createMessage(
  req: Request<{ id: string }, object, { messageContent: string }>,
  res: Response
) {
  if (!req.user) {
    throw new Error("User not found");
  }

  const { id } = req.params;

  const doesUserExist = await userModel.getUserRecordById(id);

  if (!doesUserExist) {
    res.status(404).json({ errors: [{ message: "Cannot find user to send message to." }] });
    return;
  }

  const { messageContent } = req.body;

  await messageModel.sendMessageFromUserToUser(req.user.id, id, {
    content: messageContent,
    imageUrl: null,
  });

  res.sendStatus(201);
}
