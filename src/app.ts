import "dotenv/config";
import express, { type NextFunction, type Request, type Response } from "express";
import authRouter from "./routes/authRouter.js";
import usersRouter from "./routes/usersRouter.js";
import friendshipsRouter from "./routes/friendshipsRouter.js";
import notificationsRouter from "./routes/notificationsRouter.js";
import "./config/passportConfig.js";

const app = express();

app.use(express.json());

app.use("/auth", authRouter);
app.use("/users", usersRouter);
app.use("/friendships", friendshipsRouter);
app.use("/notifications", notificationsRouter);

app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: "Resource not found" });
});

app.use((error: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(error);

  res.status(500).json({ error: error.message ? error.message : error });
});

const PORT = process.env["PORT"] ?? 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port: ${PORT}`);
});
