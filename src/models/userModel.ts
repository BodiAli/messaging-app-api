import bcrypt from "bcrypt";
import prisma from "./prismaClient/prisma.js";

export async function createUserRecord(username: string, password: string) {
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      lastSeen: new Date(),
      password: hashedPassword,
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

export async function updateUserRecordLastSeen(id: string) {
  const updatedUser = await prisma.user.update({
    where: {
      id,
    },
    data: {
      lastSeen: new Date(),
    },
    omit: {
      password: true,
    },
  });

  return updatedUser;
}
