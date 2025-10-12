import { beforeEach, describe, expect, it } from "vitest";
import * as friendshipModel from "../../models/friendshipModel.js";
import * as userModel from "../../models/userModel.js";
import type { User } from "../../generated/prisma/index.js";

describe("friendshipModel Queries", () => {
  describe(friendshipModel.getFriendRequestRecord, () => {
    it("should return friend request by providing sender and receiver ids in no particular order", async () => {
      expect.hasAssertions();

      const bodi = await userModel.createUserRecord("bodi", "12345");
      const john = await userModel.createUserRecord("john", "12345");

      await friendshipModel.sendFriendRequest(john.id, bodi.id);

      const existingFriendRequest1 = await friendshipModel.getFriendRequestRecord(john.id, bodi.id);
      const existingFriendRequest2 = await friendshipModel.getFriendRequestRecord(bodi.id, john.id);

      if (!existingFriendRequest1 || !existingFriendRequest2) {
        throw new Error("Friend request not found");
      }

      expect(existingFriendRequest1).toMatchObject({
        status: "PENDING",
        receiverId: bodi.id,
        senderId: john.id,
      });

      expect(existingFriendRequest2).toMatchObject({
        status: "PENDING",
        receiverId: bodi.id,
        senderId: john.id,
      });
    });
  });

  describe(friendshipModel.sendFriendRequest, () => {
    it("should send a friend request to the expected user", async () => {
      expect.hasAssertions();

      const bodi = await userModel.createUserRecord("bodi", "12345");
      const john = await userModel.createUserRecord("john", "12345");

      const friendship = await friendshipModel.sendFriendRequest(john.id, bodi.id);

      expect(friendship.status).toBe("PENDING");
      expect(friendship.senderId).toBe(john.id);
      expect(friendship.receiverId).toBe(bodi.id);
    });
  });

  describe(friendshipModel.acceptFriendRequest, () => {
    it("should update friend request to be accepted", async () => {
      expect.hasAssertions();

      const bodi = await userModel.createUserRecord("bodi", "12345");
      const john = await userModel.createUserRecord("john", "12345");

      const friendRequest = await friendshipModel.sendFriendRequest(john.id, bodi.id);

      expect(friendRequest.status).toBe("PENDING");

      const updatedFriendship = await friendshipModel.acceptFriendRequest(friendRequest.id);

      expect(updatedFriendship.status).toBe("ACCEPTED");
    });
  });

  describe(friendshipModel.getUserFriends, () => {
    let bodi: Omit<User, "password">;
    let john: Omit<User, "password">;
    let clare: Omit<User, "password">;

    beforeEach(async () => {
      bodi = await userModel.createUserRecord("bodi", "12345");
      john = await userModel.createUserRecord("john", "12345");
      clare = await userModel.createUserRecord("clare", "12345");

      const friendRequestOfJohn = await friendshipModel.sendFriendRequest(john.id, bodi.id);
      const friendRequestOfClare = await friendshipModel.sendFriendRequest(clare.id, bodi.id);

      await friendshipModel.acceptFriendRequest(friendRequestOfJohn.id);
      await friendshipModel.acceptFriendRequest(friendRequestOfClare.id);
    });

    it("should return bodi's friends", async () => {
      expect.hasAssertions();

      const friendsOfBodi = await friendshipModel.getUserFriends(bodi.id);

      expect(friendsOfBodi).toHaveLength(2);
      expect(friendsOfBodi).toStrictEqual(
        expect.arrayContaining([
          expect.objectContaining({
            username: "john",
          }),
          expect.objectContaining({
            username: "clare",
          }),
        ])
      );
    });

    it("should return john's friends", async () => {
      expect.hasAssertions();

      const friendsOfJohn = await friendshipModel.getUserFriends(john.id);

      expect(friendsOfJohn).toHaveLength(1);
      expect(friendsOfJohn).toStrictEqual(
        expect.arrayContaining([
          expect.objectContaining({
            username: "bodi",
          }),
        ])
      );
    });

    it("should return clare's friends", async () => {
      expect.hasAssertions();

      const friendsOfClare = await friendshipModel.getUserFriends(clare.id);

      expect(friendsOfClare).toHaveLength(1);
      expect(friendsOfClare).toStrictEqual(
        expect.arrayContaining([
          expect.objectContaining({
            username: "bodi",
          }),
        ])
      );
    });
  });
});
