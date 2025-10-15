import type { Request, Response } from "express";
import { Prisma } from "../generated/prisma/index.js";
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

export async function deleteFriendRequest(req: Request<{ id: string }>, res: Response) {
  const { id } = req.params;

  try {
    await friendshipModel.deleteFriendRequest(id);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (!error.meta || error.code !== "P2025") {
        throw error;
      }

      const cause = error.meta["cause"];

      res.status(404).json({ errors: [{ message: cause }] });
      return;
    }

    throw error;
  }

  res.sendStatus(204);
}

export async function updateFriendRequest(req: Request<{ id: string }>, res: Response) {
  const { id } = req.params;

  try {
    await friendshipModel.acceptFriendRequest(id);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (!error.meta || error.code !== "P2025") {
        throw error;
      }

      const cause = error.meta["cause"];

      res.status(404).json({ errors: [{ message: cause }] });
      return;
    }

    throw error;
  }

  res.sendStatus(204);
}
