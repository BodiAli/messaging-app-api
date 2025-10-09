import type { Request, Response, NextFunction } from "express";
import * as z from "zod";

export default function validateBody(Schema: z.ZodObject) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = Schema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({ errors: result.error.issues });
      return;
    }

    next();
  };
}
