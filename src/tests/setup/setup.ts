import { resetTables } from "../../generated/prisma/sql/resetTables.js";
import prisma from "../../models/prisma.js";
import { afterEach } from "vitest";

afterEach(async () => {
  await prisma.$queryRawTyped(resetTables());
});
