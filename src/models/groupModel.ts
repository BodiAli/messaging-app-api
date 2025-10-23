import CustomHttpStatusError from "../errors/httpStatusError.js";
import prisma from "./prismaClient/prisma.js";

export async function createGroup(groupName: string, adminId: string) {
  const createdGroup = await prisma.groupChat.create({
    data: {
      name: groupName,
      adminId,
    },
  });

  return createdGroup;
}

export async function getGroupWithMembers(groupId: string) {
  const groupWithMembers = await prisma.groupChat.findUnique({
    where: {
      id: groupId,
    },
    include: {
      users: {
        omit: {
          isGuest: true,
          lastSeen: true,
          password: true,
        },
        orderBy: {
          username: "asc",
        },
      },
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
  });
  return groupWithMembers;
}

export async function sendGroupInviteToUsers(groupId: string, currentUserId: string, usersIds: string[]) {
  const group = await prisma.groupChat.findUnique({
    where: {
      id: groupId,
    },
  });

  if (!group) {
    throw new CustomHttpStatusError("Group not found.", 404);
  }

  const isAdmin = group.adminId === currentUserId;

  if (!isAdmin) {
    throw new CustomHttpStatusError("You do not have permission to invite users to this group.", 403);
  }

  if (usersIds.includes(group.adminId)) {
    throw new CustomHttpStatusError("You cannot invite yourself to this group.", 422);
  }

  await prisma.groupChat.update({
    where: {
      id: groupId,
    },
    data: {
      notifications: {
        create: usersIds.map((id) => ({ type: "GROUP_INVITATION", userId: id })),
      },
    },
  });
}

export async function rejectGroupInvite(groupId: string, currentUserId: string) {
  const doesInviteExist = await prisma.notification.findUnique({
    where: {
      userId_groupChatInvitationId: {
        userId: currentUserId,
        groupChatInvitationId: groupId,
      },
    },
  });

  if (!doesInviteExist) {
    throw new CustomHttpStatusError("No invite found to reject.", 404);
  }

  await prisma.groupChat.update({
    where: {
      id: groupId,
    },
    data: {
      notifications: {
        delete: {
          userId_groupChatInvitationId: {
            userId: currentUserId,
            groupChatInvitationId: groupId,
          },
        },
      },
    },
  });
}

export async function acceptGroupInvite(groupId: string, currentUserId: string) {
  const doesInviteExist = await prisma.notification.findUnique({
    where: {
      userId_groupChatInvitationId: {
        userId: currentUserId,
        groupChatInvitationId: groupId,
      },
    },
  });

  if (!doesInviteExist) {
    throw new CustomHttpStatusError("No invite found to accept.", 404);
  }

  await prisma.groupChat.update({
    where: {
      id: groupId,
    },
    data: {
      users: {
        connect: {
          id: currentUserId,
        },
      },
    },
  });
}

export async function updateGroupName(groupId: string, currentUserId: string, newName: string) {
  const group = await prisma.groupChat.findUnique({
    where: {
      id: groupId,
    },
  });

  if (!group) {
    throw new CustomHttpStatusError("Group not found.", 404);
  }

  if (group.adminId !== currentUserId) {
    throw new CustomHttpStatusError("You do not have permission to update this group name.", 403);
  }

  const updatedGroup = await prisma.groupChat.update({
    where: {
      id: groupId,
    },

    data: {
      name: newName,
    },
  });

  return updatedGroup;
}

export async function removeGroupMember(groupId: string, memberId: string, currentUserId: string) {
  const group = await prisma.groupChat.findUnique({
    where: {
      id: groupId,
    },
  });

  if (!group) {
    throw new CustomHttpStatusError("Group not found", 404);
  }

  const isAdmin = group.adminId === currentUserId;
  const isSelf = memberId === currentUserId;

  if (!isAdmin && !isSelf) {
    throw new CustomHttpStatusError("You do not have permission to remove this member.", 403);
  }

  await prisma.groupChat.update({
    where: {
      id: groupId,
    },
    data: {
      users: {
        disconnect: {
          id: memberId,
        },
      },
    },
  });
}

export async function deleteGroup(groupId: string, currentUserId: string) {
  const group = await prisma.groupChat.findUnique({
    where: {
      id: groupId,
    },
  });

  if (!group) {
    throw new CustomHttpStatusError("Group not found.", 404);
  }

  if (group.adminId !== currentUserId) {
    throw new CustomHttpStatusError("You do not have permission to delete this group.", 403);
  }

  await prisma.groupChat.delete({
    where: {
      id: groupId,
    },
  });
}

export async function getUserGroups(userId: string) {
  const groups = await prisma.groupChat.findMany({
    where: {
      OR: [
        {
          adminId: userId,
        },
        {
          users: {
            some: {
              id: userId,
            },
          },
        },
      ],
    },
  });

  return groups;
}
