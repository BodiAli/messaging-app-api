import { describe, expect, it } from "vitest";
import * as notificationModel from "../../models/notificationModel.js";
import * as friendshipModel from "../../models/friendshipModel.js";
import * as userModel from "../../models/userModel.js";

describe("notificationModel queries", () => {
  describe(notificationModel.getUserNotifications, () => {
    it("should return user's notifications friend requests", async () => {
      expect.hasAssertions();

      const bodi = await userModel.createUserRecord("bodi", "12345");
      const john = await userModel.createUserRecord("john", "12345");
      const clare = await userModel.createUserRecord("clare", "12345");

      await friendshipModel.sendFriendRequest(john.id, bodi.id);
      await friendshipModel.sendFriendRequest(clare.id, bodi.id);

      const bodiNotifications = await notificationModel.getUserNotifications(bodi.id);

      expect(bodiNotifications).toHaveLength(2);
      expect(bodiNotifications[0]).toStrictEqual({
        createdAt: expect.any(Date) as Date,
        id: expect.any(String) as string,
        type: "FRIEND_REQUEST",
        groupChatInvitation: null,
        friendRequest: {
          createdAt: expect.any(Date) as Date,
          id: expect.any(String) as string,
          status: "PENDING",
          receiverId: bodi.id,
          sender: {
            id: john.id,
            imageUrl: null,
            username: "john",
          },
        },
      });
    });
  });
});
