import prisma from "./prisma.js";

export async function sendMessageFromUserToUser(
  senderId: string,
  receiverId: string,
  { content, imageUrl }: { content: string; imageUrl: string | null }
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

export async function getMessagesBetweenTwoUsers(userAId: string, userBId: string) {
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
