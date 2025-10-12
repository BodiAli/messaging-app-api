import type { Request, Response } from "express";
import * as friendshipModel from "../models/friendshipModel.js";

export async function createFriendRequest(
  req: Request<object, object, { senderId: string; receiverId: string }>,
  res: Response
) {
  const { receiverId, senderId } = req.body;

  const existingFriendRequest = await friendshipModel.getFriendRequestRecord(senderId, receiverId);

  if (existingFriendRequest) {
    res
      .status(409)
      .json({ errors: [`A friend request is already sent by ${existingFriendRequest.sender.username}`] });

    return;
  }

  // await friendshipModel.sendFriendRequest();

  res.status(201).json({ message: "Friend request sent to bodi" });
}
