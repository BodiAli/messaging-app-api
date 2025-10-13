import prisma from "./prisma.js";

export async function sendMessageFromUserToUSer(
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
