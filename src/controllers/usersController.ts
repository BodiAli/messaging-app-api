import cloudinary from "../config/cloudinaryConfig.js";
import * as friendshipModel from "../models/friendshipModel.js";
import * as messageModel from "../models/messageModel.js";
import * as userModel from "../models/userModel.js";
import type { UploadApiResponse } from "cloudinary";
import type { NextFunction, Request, Response } from "express";

export async function getUserFriends(req: Request, res: Response) {
  if (!req.user) {
    throw new Error("User not found");
  }

  const friends = await friendshipModel.getUserFriends(req.user.id);

  res.status(200).json({ friends });
}

export async function getTwoUsersMessages(
  req: Request<{ id: string }>,
  res: Response,
) {
  if (!req.user) {
    throw new Error("User not found");
  }

  const { id } = req.params;

  const user = await userModel.getUserRecordById(id);

  if (!user) {
    res.status(404).json({ errors: [{ message: "User not found." }] });
    return;
  }

  const friendRequestRecord = await friendshipModel.getFriendRequestRecord(
    req.user.id,
    id,
  );
  const friendRequestStatus = friendRequestRecord
    ? {
        type: friendRequestRecord.status,
        senderId: friendRequestRecord.senderId,
      }
    : null;

  const messages = await messageModel.getMessagesBetweenTwoUsers(
    req.user.id,
    id,
  );

  res.json({
    messages,
    user: {
      username: user.username,
      imageUrl: user.imageUrl,
      lastSeen: friendRequestStatus?.type === "ACCEPTED" ? user.lastSeen : null,
    },
    friendRequestStatus,
  });
}

export async function createMessage(
  req: Request<{ id: string }, object, { messageContent: string }>,
  res: Response,
  next: NextFunction,
) {
  if (!req.user) {
    throw new Error("User not found");
  }

  const { id: receiverId } = req.params;
  const { messageContent } = req.body;

  const doesUserExist = await userModel.getUserRecordById(receiverId);

  if (!doesUserExist) {
    res
      .status(404)
      .json({ errors: [{ message: "Cannot find user to send message to." }] });
    return;
  }

  let imageUrl: string | null = null;

  const file = req.file;

  if (file) {
    try {
      const { secure_url } = await new Promise<UploadApiResponse>(
        (resolve, reject) => {
          cloudinary.uploader
            .upload_stream(
              { resource_type: "image" },
              (error, uploadResult) => {
                if (error) {
                  reject(error as Error);
                  return;
                }

                if (!uploadResult) {
                  reject(new Error("Upload result not found"));
                  return;
                }

                resolve(uploadResult);
              },
            )
            .end(file.buffer);
        },
      );

      imageUrl = secure_url;
    } catch (error) {
      next(error);
      return;
    }
  }

  const createdMessage = await messageModel.sendMessageFromUserToUser(
    req.user.id,
    receiverId,
    {
      content: messageContent,
      imageUrl,
    },
  );

  res.status(201).json({ message: createdMessage });
}

export async function getNonFriendsOfUser(req: Request, res: Response) {
  if (!req.user) {
    throw new Error("User not found");
  }

  const nonFriends = await friendshipModel.getAnonymousUsers(req.user.id);

  res.status(200).json({ nonFriends });
}

export async function updateUserProfilePicture(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (!req.user) {
    throw new Error("User not found");
  }

  const file = req.file;

  if (!file) {
    throw new Error("File object not found");
  }

  try {
    const { secure_url } = await new Promise<UploadApiResponse>(
      (resolve, reject) => {
        cloudinary.uploader
          .upload_stream({ resource_type: "image" }, (error, uploadResult) => {
            if (error || !uploadResult) {
              reject(error as Error);
              return;
            }

            resolve(uploadResult);
          })
          .end(file.buffer);
      },
    );

    const updatedUser = await userModel.updateUserImageUrl(
      req.user.id,
      secure_url,
    );

    res.status(200).json({ user: updatedUser });
  } catch (error) {
    next(error);
  }
}
