import prisma from "./prisma.js";

export async function getFriendRequestRecord(userAId: string, userBId: string) {
  const friendRequest =
    (await prisma.friendship.findUnique({
      where: {
        senderId_receiverId: {
          receiverId: userAId,
          senderId: userBId,
        },
      },
      include: {
        sender: {
          select: {
            username: true,
          },
        },
      },
    })) ??
    (await prisma.friendship.findUnique({
      where: {
        senderId_receiverId: {
          receiverId: userBId,
          senderId: userAId,
        },
      },
      include: {
        sender: {
          select: {
            username: true,
          },
        },
      },
    }));

  return friendRequest;
}

export async function sendFriendRequest(senderId: string, receiverId: string) {
  const friendship = await prisma.friendship.create({
    data: {
      notification: {
        create: {
          type: "FRIEND_REQUEST",
          userId: receiverId,
        },
      },
      senderId,
      receiverId,
      status: "PENDING",
    },
  });

  return friendship;
}

export async function acceptFriendRequest(friendRequestId: string) {
  const friendship = await prisma.friendship.update({
    where: {
      id: friendRequestId,
    },
    data: {
      status: "ACCEPTED",
    },
  });

  return friendship;
}

export async function getUserFriends(id: string) {
  const user = await prisma.user.findUnique({
    where: {
      id,
    },
    include: {
      receivedFriendRequests: {
        where: {
          status: "ACCEPTED",
        },
        select: {
          sender: {
            omit: {
              isGuest: true,
              password: true,
            },
          },
        },
      },
      sentFriendRequests: {
        where: {
          status: "ACCEPTED",
        },
        include: {
          receiver: {
            omit: {
              isGuest: true,
              password: true,
            },
          },
        },
      },
    },

    omit: {
      password: true,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const acceptedFriendRequests = user.receivedFriendRequests.map((request) => {
    return request.sender;
  });

  const acceptedSentRequests = user.sentFriendRequests.map((request) => {
    return request.receiver;
  });

  const friends = [...acceptedFriendRequests, ...acceptedSentRequests];

  return friends;
}
