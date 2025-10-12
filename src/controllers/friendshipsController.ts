import type { Request, Response } from "express";
import * as friendshipModel from "../models/friendshipModel.js";
import * as userModel from "../models/userModel.js";

export async function createFriendRequest(
  req: Request<object, object, { receiverId: string }>,
  res: Response
) {
  if (!req.user) {
    throw new Error("User undefined");
  }

  const { receiverId } = req.body;

  const existingFriendRequest = await friendshipModel.getFriendRequestRecord(req.user.id, receiverId);

  if (existingFriendRequest) {
    res
      .status(409)
      .json({ errors: [`A friend request is already sent by ${existingFriendRequest.sender.username}`] });

    return;
  }

  await friendshipModel.sendFriendRequest(req.user.id, receiverId);

  const receiverRecord = await userModel.getUserRecordById(receiverId);

  if (!receiverRecord) {
    throw new Error("Receiver not found");
  }

  res.status(201).json({ message: `Friend request sent to ${receiverRecord.username}` });
}
