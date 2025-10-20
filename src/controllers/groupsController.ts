import type { Request, Response } from "express";

export async function getUserGroups(req: Request<{ userId: string }>, res: Response) {
  const { userId } = req.params;

  // const userGroups = await groupModel.

  res.json("hiii");
}
