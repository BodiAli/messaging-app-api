import { afterEach } from "vitest";
import { resetTables } from "../../generated/prisma/sql/resetTables.js";
import prisma from "../../models/prismaClient/prisma.js";

afterEach(async () => {
  await prisma.$queryRawTyped(resetTables());
});
