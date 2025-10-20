import { describe, expect, it } from "vitest";
import * as groupModel from "../../models/groupModel.js";
import * as userModel from "../../models/userModel.js";
import prisma from "../../models/prismaClient/prisma.js";

describe("groupModel queries", () => {
  describe(groupModel.createGroup, () => {
    it("should create new group", async () => {
      expect.hasAssertions();

      const admin = await userModel.createUserRecord("admin", "12345");
      const createdGroup = await groupModel.createGroup("createdGroup", admin.id);

      expect(createdGroup).toStrictEqual({
        id: createdGroup.id,
        name: "createdGroup",
        createdAt: expect.any(Date) as Date,
        adminId: admin.id,
      });
    });
  });

  describe(groupModel.inviteUsersToGroup, () => {
    it("should add expected users to expected group", async () => {
      expect.hasAssertions();

      const admin = await userModel.createUserRecord("admin", "12345");
      const userA = await userModel.createUserRecord("userA", "12345");
      const userB = await userModel.createUserRecord("userB", "12345");
      const userC = await userModel.createUserRecord("userC", "12345");

      const createdGroup = await groupModel.createGroup("createdGroup", admin.id);

      await groupModel.inviteUsersToGroup(createdGroup.id, [userA.id, userB.id, userC.id]);

      const updatedGroup = await groupModel.getGroupMembers(createdGroup.id);

      expect(updatedGroup).toStrictEqual({
        id: createdGroup.id,
        createdAt: createdGroup.createdAt,
        name: "createdGroup",
        adminId: admin.id,
        users: [
          {
            id: userA.id,
            username: userA.username,
            imageUrl: userA.imageUrl,
          },
          {
            id: userB.id,
            username: userB.username,
            imageUrl: userB.imageUrl,
          },
          {
            id: userC.id,
            username: userC.username,
            imageUrl: userC.imageUrl,
          },
        ],
      });
    });
  });

  describe(groupModel.getGroupMembers, () => {
    it("should return group members sorted by username", async () => {
      expect.hasAssertions();

      const admin = await userModel.createUserRecord("admin", "12345");
      const userA = await userModel.createUserRecord("userA", "12345");
      const userB = await userModel.createUserRecord("userB", "12345");
      const userC = await userModel.createUserRecord("userC", "12345");

      const createdGroup = await groupModel.createGroup("createdGroup", admin.id);

      await groupModel.inviteUsersToGroup(createdGroup.id, [userB.id, userA.id, userC.id]);

      const updatedGroup = await groupModel.getGroupMembers(createdGroup.id);

      if (!updatedGroup) {
        throw new Error("Group not found");
      }

      expect(updatedGroup.users).toStrictEqual([
        {
          id: userA.id,
          username: userA.username,
          imageUrl: userA.imageUrl,
        },
        {
          id: userB.id,
          username: userB.username,
          imageUrl: userB.imageUrl,
        },
        {
          id: userC.id,
          username: userC.username,
          imageUrl: userC.imageUrl,
        },
      ]);
    });
  });

  describe(groupModel.updateGroupName, () => {
    it("should update group name and return updated record", async () => {
      expect.hasAssertions();

      const admin = await userModel.createUserRecord("admin", "12345");

      const createdGroup = await groupModel.createGroup("createdGroup", admin.id);

      const updatedGroup = await groupModel.updateGroupName(createdGroup.id, "new name");

      expect(updatedGroup.name).toBe("new name");
    });
  });

  describe(groupModel.removeGroupMember, () => {
    it("should throw an error if a not authorized user removes a member", async () => {
      expect.hasAssertions();

      const admin = await userModel.createUserRecord("admin", "12345");
      const userA = await userModel.createUserRecord("userA", "12345");
      const userB = await userModel.createUserRecord("userB", "12345");
      const userC = await userModel.createUserRecord("userC", "12345");

      const createdGroup = await groupModel.createGroup("createdGroup", admin.id);

      await groupModel.inviteUsersToGroup(createdGroup.id, [userB.id, userA.id, userC.id]);

      await expect(groupModel.removeGroupMember(createdGroup.id, userB.id, userA.id)).rejects.toThrow(
        "You do not have permission to remove this member."
      );
    });

    it("should remove expected member from group when current user is member", async () => {
      expect.hasAssertions();

      const admin = await userModel.createUserRecord("admin", "12345");
      const userA = await userModel.createUserRecord("userA", "12345");
      const userB = await userModel.createUserRecord("userB", "12345");
      const userC = await userModel.createUserRecord("userC", "12345");

      const createdGroup = await groupModel.createGroup("createdGroup", admin.id);

      await groupModel.inviteUsersToGroup(createdGroup.id, [userB.id, userA.id, userC.id]);

      await groupModel.removeGroupMember(createdGroup.id, userB.id, userB.id);

      const updatedGroup = await groupModel.getGroupMembers(createdGroup.id);

      if (!updatedGroup) {
        throw new Error("Group not found");
      }

      expect(updatedGroup.users).toStrictEqual([
        {
          id: userA.id,
          username: userA.username,
          imageUrl: userA.imageUrl,
        },
        {
          id: userC.id,
          username: userC.username,
          imageUrl: userC.imageUrl,
        },
      ]);
    });

    it("should remove expected member from group when admin is current user", async () => {
      expect.hasAssertions();

      const admin = await userModel.createUserRecord("admin", "12345");
      const userA = await userModel.createUserRecord("userA", "12345");
      const userB = await userModel.createUserRecord("userB", "12345");
      const userC = await userModel.createUserRecord("userC", "12345");

      const createdGroup = await groupModel.createGroup("createdGroup", admin.id);

      await groupModel.inviteUsersToGroup(createdGroup.id, [userB.id, userA.id, userC.id]);

      await groupModel.removeGroupMember(createdGroup.id, userB.id, admin.id);

      const updatedGroup = await groupModel.getGroupMembers(createdGroup.id);

      if (!updatedGroup) {
        throw new Error("Group not found");
      }

      expect(updatedGroup.users).toStrictEqual([
        {
          id: userA.id,
          username: userA.username,
          imageUrl: userA.imageUrl,
        },
        {
          id: userC.id,
          username: userC.username,
          imageUrl: userC.imageUrl,
        },
      ]);
    });
  });

  describe(groupModel.deleteGroup, () => {
    it("should throw an error if a non group admin requests a delete", async () => {
      expect.hasAssertions();

      const admin = await userModel.createUserRecord("admin", "12345");
      const userA = await userModel.createUserRecord("userA", "12345");

      const createdGroup = await groupModel.createGroup("createdGroup", admin.id);

      await expect(groupModel.deleteGroup(createdGroup.id, userA.id)).rejects.toThrow(
        "You do not have permission to delete this group."
      );
    });

    it("should delete group", async () => {
      expect.hasAssertions();

      const admin = await userModel.createUserRecord("admin", "12345");

      const createdGroup = await groupModel.createGroup("createdGroup", admin.id);

      await groupModel.deleteGroup(createdGroup.id, admin.id);

      await expect(groupModel.getGroupMembers(createdGroup.id)).resolves.toBeNull();
    });
  });
});
