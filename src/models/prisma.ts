import { PrismaClient } from "../generated/prisma/index.js";

const databaseUrl =
  process.env["NODE_ENV"] === "test" ? process.env.TEST_DATABASE_URL : process.env.DATABASE_URL;

export default new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl,
    },
  },
});
