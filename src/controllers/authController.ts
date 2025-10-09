import type { NextFunction, Request, RequestHandler, Response } from "express";
import bcrypt from "bcrypt";
import { createUserRecord, getOrCreateUserRecord } from "../models/userModel.js";
import { Prisma, type User } from "../generated/prisma/index.js";
import issueJwt from "../lib/issueJwt.js";
import passport from "passport";

export async function createUser(
  req: Request<object, object, { username: string; password: string; confirmPassword: string }>,
  res: Response,
  next: NextFunction
) {
  try {
    const { username, password } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const createdUser = await createUserRecord(username, hashedPassword);
    const token = issueJwt(createdUser.id, "2w");

    res.status(201).json({ token, user: createdUser });
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

export function authenticateUser(req: Request, res: Response, next: NextFunction) {
  (
    passport.authenticate(
      "local",
      { session: false },
      (err: unknown, user: User | false, info: { message: string }) => {
        if (err) {
          next(err);
          return;
        }

        if (!user) {
          res.status(401).json({ errors: [{ message: info.message }] });
          return;
        }

        const token = issueJwt(user.id, "2w");
        const { password: _password, ...userWithoutPassword } = user;
        res.json({ token, user: userWithoutPassword });
      }
    ) as RequestHandler
  )(req, res, next);
}

export async function logInAsGuest(_req: Request, res: Response) {
  const hashedPassword = await bcrypt.hash("guestPassword", 10);
  const guestUser = await getOrCreateUserRecord("guest-user", hashedPassword);

  const token = issueJwt(guestUser.id, "30m");

  res.json({ token, user: guestUser });
}
