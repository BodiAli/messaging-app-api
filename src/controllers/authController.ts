import type { Request, Response } from "express";
import { createUserRecord, getUserRecordByUsername } from "../models/userModel.js";
import { UserSignUpSchema } from "../lib/zodSchemas.js";
import issueJwt from "../lib/issueJwt.js";

export async function createUser(
  req: Request<object, object, { username: string; password: string; confirmPassword: string }>,
  res: Response
) {
  const result = UserSignUpSchema.safeParse(req.body);

  if (!result.success) {
    res.status(400).json({ errors: result.error.issues });
    return;
  }

  const doesUserExist = !!(await getUserRecordByUsername(req.body.username));

  if (doesUserExist) {
    res.status(409).json({ errors: [{ message: "A user with this username already exists." }] });
    return;
  }

  const createUser = await createUserRecord(req.body.username, req.body.confirmPassword);
  const token = issueJwt(createUser.id);

  res.json({ token });
}
