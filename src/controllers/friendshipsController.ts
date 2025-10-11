import type { Request, Response } from "express";

export async function createFriendRequest(req: Request, res: Response) {
  res.json({ success: true });
}
