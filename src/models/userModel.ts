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

export async function getUserRecordByIdUnsafe(id: string) {
  const user = await prisma.user.findUnique({
    where: {
      id,
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

export async function getOrCreateUserRecord(username: string, password: string) {
  const guestUser = await prisma.user.upsert({
    where: {
      username,
    },
    update: {},
    create: {
      password,
      username,
      lastSeen: new Date(),
      isGuest: true,
    },
    omit: {
      password: true,
    },
  });

  return guestUser;
}
