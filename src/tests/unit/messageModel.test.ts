import { describe, expect, it } from "vitest";
import * as userModel from "../../models/userModel.js";
import * as messageModel from "../../models/messageModel.js";
import * as groupModel from "../../models/groupModel.js";

describe("messageModel queries", () => {
  describe(messageModel.sendMessageFromUserToUser, () => {
    it("should create a message by userA to userB", async () => {
      expect.hasAssertions();

      const userA = await userModel.createUserRecord("userA", "12345");
      const userB = await userModel.createUserRecord("userB", "12345");

      const message1 = await messageModel.sendMessageFromUserToUser(
        userA.id,
        userB.id,
        {
          content: "Hello from userA to userB",
          imageUrl: null,
        },
      );

      const message2 = await messageModel.sendMessageFromUserToUser(
        userA.id,
        userB.id,
        {
          content: "Hello again!",
          imageUrl: "exampleUrl",
        },
      );

      expect(message1).toStrictEqual({
        id: expect.any(String) as string,
        content: "Hello from userA to userB",
        imageUrl: null,
        createdAt: expect.any(Date) as Date,
        senderId: userA.id,
        receiverId: userB.id,
        groupChatId: null,
      });

      expect(message2.content).toBe("Hello again!");
      expect(message2.imageUrl).toBe("exampleUrl");
    });
  });

  describe(messageModel.getMessagesBetweenTwoUsers, () => {
    it("should return an array of messages between userA and userB when providing userA and userB ids regardless of order", async () => {
      expect.hasAssertions();

      const userA = await userModel.createUserRecord("userA", "12345");
      const userB = await userModel.createUserRecord("userB", "12345");

      await messageModel.sendMessageFromUserToUser(userA.id, userB.id, {
        content: "Hello from userA to userB",
        imageUrl: null,
      });

      await messageModel.sendMessageFromUserToUser(userA.id, userB.id, {
        content: "Hello again!",
        imageUrl: "exampleUrl",
      });

      const messages1 = await messageModel.getMessagesBetweenTwoUsers(
        userB.id,
        userA.id,
      );
      const messages2 = await messageModel.getMessagesBetweenTwoUsers(
        userA.id,
        userB.id,
      );

      expect(messages1).toStrictEqual(messages2);
      expect(messages1).toStrictEqual([
        {
          id: expect.any(String) as string,
          content: "Hello from userA to userB",
          imageUrl: null,
          createdAt: expect.any(Date) as Date,
          senderId: userA.id,
          receiverId: userB.id,
          groupChatId: null,
        },
        {
          id: expect.any(String) as string,
          content: "Hello again!",
          imageUrl: "exampleUrl",
          createdAt: expect.any(Date) as Date,
          senderId: userA.id,
          receiverId: userB.id,
          groupChatId: null,
        },
      ]);
    });
  });

  describe(messageModel.sendMessageToGroup, () => {
    it("should throw an error if group is not found", async () => {
      expect.hasAssertions();

      const userA = await userModel.createUserRecord("userA", "12345");

      await expect(
        messageModel.sendMessageToGroup(userA.id, "invalidId", {
          content: "messageContent",
          imageUrl: null,
        }),
      ).rejects.toThrow("Group not found.");
    });

    it("should throw an error if a non-member user tries to send a message", async () => {
      expect.hasAssertions();

      const userA = await userModel.createUserRecord("userA", "12345");
      const userB = await userModel.createUserRecord("userB", "12345");
      const userBGroup = await groupModel.createGroup(
        "userB's group",
        userB.id,
      );

      await expect(
        messageModel.sendMessageToGroup(userA.id, userBGroup.id, {
          content: "hello from userA",
          imageUrl: null,
        }),
      ).rejects.toThrow("You cannot send message to this group.");
    });

    it("should create a message by userA to userB's group", async () => {
      expect.hasAssertions();

      const userA = await userModel.createUserRecord("userA", "12345");
      const userB = await userModel.createUserRecord("userB", "12345");
      const userBGroup = await groupModel.createGroup(
        "userB's group",
        userB.id,
      );
      await groupModel.sendGroupInviteToUsers(userBGroup.id, userB.id, [
        userA.id,
      ]);
      await groupModel.acceptGroupInvite(userBGroup.id, userA.id);

      const message = await messageModel.sendMessageToGroup(
        userA.id,
        userBGroup.id,
        { content: "hello from userA", imageUrl: null },
      );

      expect(message).toStrictEqual<typeof message>({
        content: "hello from userA",
        createdAt: expect.any(Date) as Date,
        groupChatId: userBGroup.id,
        imageUrl: null,
        id: expect.any(String) as string,
        receiverId: null,
        senderId: userA.id,
      });
    });
  });

  describe(messageModel.getGroupMessages, () => {
    it("should throw an error if group is not found", async () => {
      expect.hasAssertions();

      const userA = await userModel.createUserRecord("userA", "12345");
      const userB = await userModel.createUserRecord("userB", "12345");
      const userBGroup = await groupModel.createGroup(
        "userB's group",
        userB.id,
      );
      await groupModel.sendGroupInviteToUsers(userBGroup.id, userB.id, [
        userA.id,
      ]);
      await groupModel.acceptGroupInvite(userBGroup.id, userA.id);

      await expect(
        messageModel.getGroupMessages("invalidId", userA.id),
      ).rejects.toThrow("Group not found.");
    });

    it("should throw an error if current user is not a member or an admin", async () => {
      expect.hasAssertions();

      const userB = await userModel.createUserRecord("userB", "12345");
      const userBGroup = await groupModel.createGroup(
        "userB's group",
        userB.id,
      );

      await expect(
        messageModel.getGroupMessages(userBGroup.id, "invalidId"),
      ).rejects.toThrow("You cannot view messages of this group.");
    });

    it("should return an array of group messages", async () => {
      expect.hasAssertions();

      const userA = await userModel.createUserRecord("userA", "12345");
      const userB = await userModel.createUserRecord("userB", "12345");
      const userBGroup = await groupModel.createGroup(
        "userB's group",
        userB.id,
      );
      await groupModel.sendGroupInviteToUsers(userBGroup.id, userB.id, [
        userA.id,
      ]);
      await groupModel.acceptGroupInvite(userBGroup.id, userA.id);

      await messageModel.sendMessageToGroup(userA.id, userBGroup.id, {
        content: "userA's message",
        imageUrl: null,
      });
      await messageModel.sendMessageToGroup(userB.id, userBGroup.id, {
        content: "userB's message",
        imageUrl: "imageUrl",
      });
      const messages = await messageModel.getGroupMessages(
        userBGroup.id,
        userA.id,
      );

      expect(messages).toStrictEqual<FlatArray<typeof messages, 1>[]>([
        {
          content: "userA's message",
          createdAt: expect.any(Date) as Date,
          groupChatId: userBGroup.id,
          id: expect.any(String) as string,
          imageUrl: null,
          receiverId: null,
          senderId: userA.id,
          sender: {
            id: userA.id,
            imageUrl: null,
            username: userA.username,
          },
        },
        {
          content: "userB's message",
          createdAt: expect.any(Date) as Date,
          groupChatId: userBGroup.id,
          id: expect.any(String) as string,
          imageUrl: "imageUrl",
          receiverId: null,
          senderId: userB.id,
          sender: {
            id: userB.id,
            imageUrl: null,
            username: userB.username,
          },
        },
      ]);
    });
  });
});
