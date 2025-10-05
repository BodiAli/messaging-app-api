import type { Request, Response } from "express";
import { createUserRecord } from "../models/userModel.js";

export async function createUser(req: Request, res: Response) {
  const user = await createUserRecord();
  console.log(user);

  res.json({ msg: "hi" });
}
