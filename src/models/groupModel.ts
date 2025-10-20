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

export async function getGroupMembers(groupId: string) {
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
    },
  });
  return groupWithMembers;
}

export async function inviteUsersToGroup(groupId: string, usersIds: string[]) {
  await prisma.groupChat.update({
    where: {
      id: groupId,
    },
    data: {
      users: {
        connect: usersIds.map((id) => {
          return { id };
        }),
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
