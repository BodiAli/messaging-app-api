import type { User as UserRecord } from "../generated/prisma/index.js";

declare global {
  namespace Express {
    interface User extends Omit<UserRecord, "password"> {}
  }
}
