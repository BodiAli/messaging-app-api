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
