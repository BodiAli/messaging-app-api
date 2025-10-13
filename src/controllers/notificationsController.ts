import type { Request, Response } from "express";
import * as notificationsModel from "../models/notificationModel.js";

export async function getUserNotifications(req: Request, res: Response) {
  if (!req.user) {
    throw new Error("User not found");
  }

  const userNotifications = await notificationsModel.getUserNotifications(req.user.id);

  res.json({ notifications: userNotifications });
}
