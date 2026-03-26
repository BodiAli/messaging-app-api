import prisma from "./prismaClient/prisma.js";
import CustomHttpStatusError from "../errors/httpStatusError.js";

export async function sendMessageFromUserToUser(
  senderId: string,
  receiverId: string,
  { content, imageUrl }: { content: string; imageUrl: string | null },
) {
  const message = await prisma.message.create({
    data: {
      content,
      imageUrl,
      senderId,
      receiverId,
    },
  });

  return message;
}

export async function getMessagesBetweenTwoUsers(
  userAId: string,
  userBId: string,
) {
  const messages = await prisma.message.findMany({
    where: {
      OR: [
        {
          receiverId: userAId,
          senderId: userBId,
        },
        {
          receiverId: userBId,
          senderId: userAId,
        },
      ],
    },
  });

  return messages;
}

export async function sendMessageToGroup(
  senderId: string,
  groupId: string,
  { content, imageUrl }: { content: string; imageUrl: string | null },
) {
  const group = await prisma.groupChat.findUnique({
    where: {
      id: groupId,
    },
    include: {
      users: true,
    },
  });
  if (!group) {
    throw new CustomHttpStatusError("Group not found.", 404);
  }
  const isMember =
    Boolean(group.users.find((user) => user.id === senderId)) ||
    group.adminId === senderId;

  if (!isMember) {
    throw new CustomHttpStatusError(
      "You cannot send message to this group.",
      403,
    );
  }

  const message = await prisma.message.create({
    data: {
      content,
      imageUrl,
      senderId,
      groupChatId: groupId,
    },
  });

  return message;
}

export async function getGroupMessages(groupId: string, currentUserId: string) {
  const group = await prisma.groupChat.findUnique({
    where: {
      id: groupId,
    },
    include: {
      users: true,
    },
  });

  if (!group) {
    throw new CustomHttpStatusError("Group not found.", 404);
  }

  const isMember =
    Boolean(group.users.find((user) => user.id === currentUserId)) ||
    group.adminId === currentUserId;

  if (!isMember) {
    throw new CustomHttpStatusError(
      "You cannot view messages of this group.",
      403,
    );
  }

  const messages = await prisma.message.findMany({
    where: {
      groupChatId: groupId,
    },
  });

  return messages;
}
