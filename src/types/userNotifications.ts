import type { NotificationType, GroupChat, User, Friendship } from "../generated/prisma/index.js";

interface GroupInviteNotification {
  id: string;
  createdAt: Date;
  type: NotificationType;
  friendRequest: null;
  groupChatInvitation: Omit<GroupChat, "adminId"> & { admin: Pick<User, "username" | "imageUrl" | "id"> };
}

interface FriendRequestNotification {
  id: string;
  createdAt: Date;
  type: NotificationType;
  groupChatInvitation: null;
  friendRequest: Omit<Friendship, "senderId"> & { sender: Pick<User, "username" | "imageUrl" | "id"> };
}

export type UserNotifications = (FriendRequestNotification | GroupInviteNotification)[];
