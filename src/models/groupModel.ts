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
    throw new Error("Group not found");
  }

  const isAdmin = group.adminId === currentUserId;

  if (!isAdmin) {
    throw new Error("You do not have permission to invite users to this group.");
  }

  if (usersIds.includes(group.adminId)) {
    throw new Error("You cannot invite yourself to this group.");
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
    throw new Error("No invite found to reject.");
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
    throw new Error("No invite found to accept.");
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

export async function updateGroupName(groupId: string, newName: string) {
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
    throw new Error("Group not found");
  }

  const isAdmin = group.adminId === currentUserId;
  const isSelf = memberId === currentUserId;

  if (!isAdmin && !isSelf) {
    throw new Error("You do not have permission to remove this member.");
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
    throw new Error("Group not found");
  }

  if (group.adminId !== currentUserId) {
    throw new Error("You do not have permission to delete this group.");
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
