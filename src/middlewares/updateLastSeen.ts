import { updateUserRecordLastSeen } from "../models/userModel.js";
import type { Response, Request, NextFunction } from "express";

export default async function updateLastSeen(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  if (!req.user) {
    throw new Error("User is not defined.");
  }

  await updateUserRecordLastSeen(req.user.id);
  next();
}
