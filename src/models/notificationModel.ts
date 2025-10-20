import prisma from "./prismaClient/prisma.js";

export async function getUserNotifications(id: string) {
  const notifications = await prisma.notification.findMany({
    where: {
      userId: id,

      OR: [
        {
          friendRequest: {
            status: "PENDING",
          },
        },
        {
          groupChatInvitationId: {
            not: null,
          },
        },
      ],
    },

    include: {
      friendRequest: {
        include: {
          sender: {
            omit: {
              password: true,
              lastSeen: true,
              isGuest: true,
            },
          },
        },
        omit: {
          senderId: true,
        },
      },
      groupChatInvitation: {
        include: {
          admin: {
            omit: {
              password: true,
              lastSeen: true,
              isGuest: true,
            },
          },
        },
        omit: {
          adminId: true,
        },
      },
    },
    omit: {
      friendRequestId: true,
      groupChatInvitationId: true,
      userId: true,
    },
  });

  return notifications;
}
