import prisma from "./prisma.js";

export async function createUserRecord(username: string, password: string) {
  const user = await prisma.user.create({
    data: {
      lastSeen: new Date(),
      password,
      username,
    },
    omit: {
      password: true,
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

export async function getUserRecordByUsername(username: string) {
  const user = await prisma.user.findUnique({
    where: {
      username,
    },
  });

  return user;
}
