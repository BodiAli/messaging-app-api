import { describe, expect, it } from "vitest";
import * as userModel from "../../models/userModel.js";
import * as messageModal from "../../models/messageModel.js";

describe("messageModal queries", () => {
  describe(messageModal.sendMessageFromUserToUSer, () => {
    it("should create a message by userA to userB", async () => {
      expect.hasAssertions();

      const userA = await userModel.createUserRecord("userA", "12345");
      const userB = await userModel.createUserRecord("userB", "12345");

      const message1 = await messageModal.sendMessageFromUserToUSer(userA.id, userB.id, {
        content: "Hello from userA to userB",
        imageUrl: null,
      });

      const message2 = await messageModal.sendMessageFromUserToUSer(userA.id, userB.id, {
        content: "Hello again!",
        imageUrl: "exampleUrl",
      });

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

  describe(messageModal.getMessagesBetweenTwoUsers, () => {
    it("should return an array of messages between userA and userB when providing userA and userB ids regardless of order", async () => {
      expect.hasAssertions();

      const userA = await userModel.createUserRecord("userA", "12345");
      const userB = await userModel.createUserRecord("userB", "12345");

      await messageModal.sendMessageFromUserToUSer(userA.id, userB.id, {
        content: "Hello from userA to userB",
        imageUrl: null,
      });

      await messageModal.sendMessageFromUserToUSer(userA.id, userB.id, {
        content: "Hello again!",
        imageUrl: "exampleUrl",
      });

      const messages1 = await messageModal.getMessagesBetweenTwoUsers(userB.id, userA.id);
      const messages2 = await messageModal.getMessagesBetweenTwoUsers(userA.id, userB.id);

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
});
