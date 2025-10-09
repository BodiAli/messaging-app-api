import type { NextFunction, Request, Response } from "express";
import { createUserRecord } from "../models/userModel.js";
import { UserSignUpSchema } from "../lib/zodSchemas.js";
import issueJwt from "../lib/issueJwt.js";
import { Prisma } from "../generated/prisma/index.js";

export async function createUser(
  req: Request<object, object, { username: string; password: string; confirmPassword: string }>,
  res: Response,
  next: NextFunction
) {
  const result = UserSignUpSchema.safeParse(req.body);

  if (!result.success) {
    res.status(400).json({ errors: result.error.issues });
    return;
  }

  try {
    const createdUser = await createUserRecord(req.body.username, req.body.confirmPassword);
    const token = issueJwt(createdUser.id);

    res.json({ token });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (!error.meta) {
        next(error);
        return;
      }

      const target = error.meta["target"] as string[];

      if (error.code === "P2002" && target[0] === "username") {
        res.status(409).json({ errors: [{ message: "A user with this username already exists." }] });
        return;
      }
    }
    next(error);
  }
}
