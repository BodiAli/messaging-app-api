import { beforeEach, describe, expect, it } from "vitest";
import * as notificationModel from "../../models/notificationModel.js";
import * as friendshipModel from "../../models/friendshipModel.js";
import * as userModel from "../../models/userModel.js";
import * as groupModel from "../../models/groupModel.js";
import type { User } from "../../generated/prisma/index.js";
import type { UserNotifications } from "../../types/userNotifications.js";

describe("notificationModel queries", () => {
  describe(notificationModel.getUserNotifications, () => {
    let userA: Omit<User, "password">;
    let userB: Omit<User, "password">;
    let userC: Omit<User, "password">;

    beforeEach(async () => {
      userA = await userModel.createUserRecord("userA", "12345");
      userB = await userModel.createUserRecord("userB", "12345");
      userC = await userModel.createUserRecord("userC", "12345");
    });

    it("should return user's notifications friend requests", async () => {
      expect.hasAssertions();

      await friendshipModel.sendFriendRequest(userB.id, userA.id);
      await friendshipModel.sendFriendRequest(userC.id, userA.id);

      const userANotifications = await notificationModel.getUserNotifications(userA.id);

      expect(userANotifications).toHaveLength(2);
      expect(userANotifications).toStrictEqual<UserNotifications>([
        {
          createdAt: expect.any(Date) as Date,
          id: expect.any(String) as string,
          type: "FRIEND_REQUEST",
          groupChatInvitation: null,
          friendRequest: {
            createdAt: expect.any(Date) as Date,
            id: expect.any(String) as string,
            status: "PENDING",
            receiverId: userA.id,
            sender: {
              id: userB.id,
              imageUrl: null,
              username: "userB",
            },
          },
        },
        {
          createdAt: expect.any(Date) as Date,
          id: expect.any(String) as string,
          type: "FRIEND_REQUEST",
          groupChatInvitation: null,
          friendRequest: {
            createdAt: expect.any(Date) as Date,
            id: expect.any(String) as string,
            status: "PENDING",
            receiverId: userA.id,
            sender: {
              id: userC.id,
              imageUrl: null,
              username: "userC",
            },
          },
        },
      ]);
    });

    it("should return user's group invites", async () => {
      expect.hasAssertions();

      const userAGroup = await groupModel.createGroup("userAGroup", userA.id);
      const userBGroup = await groupModel.createGroup("userBGroup", userB.id);

      await groupModel.sendGroupInviteToUsers(userAGroup.id, userA.id, [userC.id]);
      await groupModel.sendGroupInviteToUsers(userBGroup.id, userB.id, [userC.id]);

      const userCNotifications = await notificationModel.getUserNotifications(userC.id);

      expect(userCNotifications).toStrictEqual<UserNotifications>([
        {
          createdAt: expect.any(Date) as Date,
          friendRequest: null,
          type: "GROUP_INVITATION",
          id: expect.any(String) as string,
          groupChatInvitation: {
            admin: {
              id: userA.id,
              imageUrl: null,
              username: "userA",
            },
            createdAt: expect.any(Date) as Date,
            id: expect.any(String) as string,
            name: "userAGroup",
          },
        },
        {
          createdAt: expect.any(Date) as Date,
          friendRequest: null,
          type: "GROUP_INVITATION",
          id: expect.any(String) as string,
          groupChatInvitation: {
            admin: {
              id: userB.id,
              imageUrl: null,
              username: "userB",
            },
            createdAt: expect.any(Date) as Date,
            id: expect.any(String) as string,
            name: "userBGroup",
          },
        },
      ]);
    });

    it("should return both friend requests and group invites of the user", async () => {
      expect.hasAssertions();

      const userCGroup = await groupModel.createGroup("userCGroup", userC.id);

      await groupModel.sendGroupInviteToUsers(userCGroup.id, userC.id, [userA.id]);
      await friendshipModel.sendFriendRequest(userB.id, userA.id);

      const userANotifications = await notificationModel.getUserNotifications(userA.id);

      expect(userANotifications).toStrictEqual<UserNotifications>([
        {
          createdAt: expect.any(Date) as Date,
          type: "GROUP_INVITATION",
          id: expect.any(String) as string,
          friendRequest: null,
          groupChatInvitation: {
            admin: {
              id: userC.id,
              imageUrl: null,
              username: "userC",
            },
            name: "userCGroup",
            id: expect.any(String) as string,
            createdAt: expect.any(Date) as Date,
          },
        },
        {
          createdAt: expect.any(Date) as Date,
          type: "FRIEND_REQUEST",
          id: expect.any(String) as string,
          groupChatInvitation: null,
          friendRequest: {
            createdAt: expect.any(Date) as Date,
            id: expect.any(String) as string,
            receiverId: userA.id,
            status: "PENDING",
            sender: {
              id: expect.any(String) as string,
              imageUrl: null,
              username: "userB",
            },
          },
        },
      ]);
    });
  });
});
