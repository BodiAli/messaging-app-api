import { resetTables } from "../../generated/prisma/sql/resetTables.js";
import prisma from "../../models/prismaClient/prisma.js";
import { afterEach } from "vitest";

afterEach(async () => {
  await prisma.$queryRawTyped(resetTables());
});
