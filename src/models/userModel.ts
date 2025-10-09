import prisma from "./prisma.js";

export async function createUserRecord(username: string, password: string) {
  const user = await prisma.user.create({
    data: {
      lastSeen: new Date(),
      password,
      username,
    },
  });

  return user;
}

export async function getUserRecordById(id: string) {
  const user = await prisma.user.findUnique({
    where: {
      id,
    },
    omit: {
      password: true,
    },
  });

  return user;
}
