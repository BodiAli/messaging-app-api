import type { Request, Response, NextFunction } from "express";
import * as z from "zod";

export default function validateFile(FileSchema: z.ZodObject) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = FileSchema.safeParse(req.file);

    if (!result.success) {
      res.status(400).json({ errors: result.error.issues });
      return;
    }

    next();
  };
}
