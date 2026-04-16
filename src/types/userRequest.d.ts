import type { User as UserRecord } from "../generated/prisma/client.ts";

declare global {
  namespace Express {
    interface User extends Omit<UserRecord, "password"> {}
  }
}
