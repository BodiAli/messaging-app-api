import type { NextFunction, Request, Response } from "express";

export default function unauthorizeGuest(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (!req.user) {
    throw new Error("User not found");
  }

  if (req.user.isGuest) {
    res
      .status(403)
      .json({
        errors: [
          { message: "You must have an account to complete this request." },
        ],
      });
    return;
  }

  next();
}
