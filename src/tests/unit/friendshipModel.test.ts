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

  describe(friendshipModel.deleteFriendRequest, () => {
    it("should delete friend request", async () => {
      expect.hasAssertions();

      const bodi = await userModel.createUserRecord("bodi", "12345");
      const john = await userModel.createUserRecord("john", "12345");

      const friendRequest = await friendshipModel.sendFriendRequest(john.id, bodi.id);

      await friendshipModel.deleteFriendRequest(friendRequest.id);

      const doesNotExistFriendRequest = await friendshipModel.getFriendRequestRecord(bodi.id, john.id);

      expect(doesNotExistFriendRequest).toBeNull();
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

  describe(friendshipModel.getAnonymousUsers, () => {
    type AnonymousUsers = Pick<User, "id" | "username" | "imageUrl">[];

    let bodi: Omit<User, "password">;
    let john: Omit<User, "password">;
    let clare: Omit<User, "password">;
    let ahmed: Omit<User, "password">;

    beforeEach(async () => {
      bodi = await userModel.createUserRecord("bodi", "12345");
      john = await userModel.createUserRecord("john", "12345");
      clare = await userModel.createUserRecord("clare", "12345");
      ahmed = await userModel.createUserRecord("ahmed", "12345");

      const friendRequestOfJohn = await friendshipModel.sendFriendRequest(john.id, bodi.id);
      await friendshipModel.sendFriendRequest(clare.id, bodi.id);

      await friendshipModel.acceptFriendRequest(friendRequestOfJohn.id);
    });

    it("should return bodi's non-friends", async () => {
      expect.hasAssertions();

      const nonFriendsOfBodi = await friendshipModel.getAnonymousUsers(bodi.id);

      expect(nonFriendsOfBodi).toStrictEqual<AnonymousUsers>([
        {
          id: ahmed.id,
          imageUrl: null,
          username: "ahmed",
        },
        {
          id: clare.id,
          imageUrl: null,
          username: "clare",
        },
      ]);
    });

    it("should return john's non-friends", async () => {
      expect.hasAssertions();

      const nonFriendsOfJohn = await friendshipModel.getAnonymousUsers(john.id);

      expect(nonFriendsOfJohn).toStrictEqual<AnonymousUsers>([
        {
          id: ahmed.id,
          imageUrl: null,
          username: "ahmed",
        },
        {
          id: clare.id,
          imageUrl: null,
          username: "clare",
        },
      ]);
    });

    it("should return clare's non-friends", async () => {
      expect.hasAssertions();

      const nonFriendsOfClare = await friendshipModel.getAnonymousUsers(clare.id);

      expect(nonFriendsOfClare).toStrictEqual<AnonymousUsers>([
        {
          id: ahmed.id,
          imageUrl: null,
          username: "ahmed",
        },
        {
          id: bodi.id,
          imageUrl: null,
          username: "bodi",
        },
        {
          id: john.id,
          imageUrl: null,
          username: "john",
        },
      ]);
    });

    it("should return ahmed's non-friends", async () => {
      expect.hasAssertions();

      const nonFriendsOfAhmed = await friendshipModel.getAnonymousUsers(ahmed.id);

      expect(nonFriendsOfAhmed).toStrictEqual<AnonymousUsers>([
        {
          id: bodi.id,
          imageUrl: null,
          username: "bodi",
        },
        {
          id: clare.id,
          imageUrl: null,
          username: "clare",
        },
        {
          id: john.id,
          imageUrl: null,
          username: "john",
        },
      ]);
    });
  });
});
