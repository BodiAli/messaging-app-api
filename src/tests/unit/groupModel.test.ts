import { beforeEach, describe, expect, it } from "vitest";
import * as groupModel from "../../models/groupModel.js";
import * as userModel from "../../models/userModel.js";
import * as notificationModel from "../../models/notificationModel.js";
import type { GroupChat, User } from "../../generated/prisma/index.js";

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

  describe(groupModel.sendGroupInviteToUsers, () => {
    let admin: Omit<User, "password">;
    let userA: Omit<User, "password">;
    let userB: Omit<User, "password">;
    let userC: Omit<User, "password">;

    let createdGroup: GroupChat;

    beforeEach(async () => {
      admin = await userModel.createUserRecord("admin", "12345");
      userA = await userModel.createUserRecord("userA", "12345");
      userB = await userModel.createUserRecord("userB", "12345");
      userC = await userModel.createUserRecord("userC", "12345");
      createdGroup = await groupModel.createGroup("createdGroup", admin.id);
    });

    it("should throw an error when a non-admin sends an invite", async () => {
      expect.hasAssertions();

      await expect(
        groupModel.sendGroupInviteToUsers(createdGroup.id, userA.id, [userA.id, userB.id, userC.id])
      ).rejects.toThrow("You do not have permission to invite users to this group.");
    });

    it("should throw an error when admin tries to invite themselves", async () => {
      expect.hasAssertions();

      await expect(
        groupModel.sendGroupInviteToUsers(createdGroup.id, admin.id, [userA.id, userB.id, admin.id])
      ).rejects.toThrow("You cannot invite yourself to this group.");
    });

    it("should send group invites to multiple users", async () => {
      expect.hasAssertions();

      await groupModel.sendGroupInviteToUsers(createdGroup.id, admin.id, [userA.id, userB.id, userC.id]);

      const userANotifications = await notificationModel.getUserNotifications(userA.id);
      const userBNotifications = await notificationModel.getUserNotifications(userB.id);
      const userCNotifications = await notificationModel.getUserNotifications(userC.id);

      expect(userANotifications).toHaveLength(1);
      expect(userBNotifications).toHaveLength(1);
      expect(userCNotifications).toHaveLength(1);
    });
  });

  describe(groupModel.acceptGroupInvite, () => {
    it("should throw an error when a user with no invite tries to accept an invite", async () => {
      expect.hasAssertions();

      const admin = await userModel.createUserRecord("admin", "12345");
      const userA = await userModel.createUserRecord("userA", "12345");
      const userC = await userModel.createUserRecord("userC", "12345");

      const createdGroup = await groupModel.createGroup("createdGroup", admin.id);

      await groupModel.sendGroupInviteToUsers(createdGroup.id, admin.id, [userA.id]);

      await expect(groupModel.acceptGroupInvite(createdGroup.id, userC.id)).rejects.toThrow(
        "No invite found to accept."
      );
    });

    it("should accept group invite", async () => {
      expect.hasAssertions();

      const admin = await userModel.createUserRecord("admin", "12345");
      const userA = await userModel.createUserRecord("userA", "12345");

      const createdGroup = await groupModel.createGroup("createdGroup", admin.id);

      await groupModel.sendGroupInviteToUsers(createdGroup.id, admin.id, [userA.id]);

      const groupWithNoUsers = await groupModel.getGroupWithMembers(createdGroup.id);

      if (!groupWithNoUsers) {
        throw new Error("Group not found");
      }

      expect(groupWithNoUsers.users).toHaveLength(0);

      const userANotifications = await notificationModel.getUserNotifications(userA.id);

      if (!userANotifications[0] || !userANotifications[0].groupChatInvitation) {
        throw new Error("Notification not found");
      }

      expect(userANotifications[0].groupChatInvitation.name).toBe("createdGroup");

      await groupModel.acceptGroupInvite(createdGroup.id, userA.id);

      const updatedUserANotifications = await notificationModel.getUserNotifications(userA.id);

      expect(updatedUserANotifications).toHaveLength(0);

      const groupWithUsers = await groupModel.getGroupWithMembers(createdGroup.id);

      if (!groupWithUsers) {
        throw new Error("Group not found");
      }

      expect(groupWithUsers.users).toStrictEqual<Pick<User, "id" | "imageUrl" | "username">[]>([
        {
          id: userA.id,
          imageUrl: null,
          username: "userA",
        },
      ]);
    });
  });

  describe(groupModel.rejectGroupInvite, () => {
    it("should throw an error when a user tries to reject a non-existing invite", async () => {
      expect.hasAssertions();

      const admin = await userModel.createUserRecord("admin", "12345");
      const userA = await userModel.createUserRecord("userA", "12345");
      const userC = await userModel.createUserRecord("userC", "12345");

      const createdGroup = await groupModel.createGroup("createdGroup", admin.id);

      await groupModel.sendGroupInviteToUsers(createdGroup.id, admin.id, [userA.id]);

      await expect(groupModel.rejectGroupInvite(createdGroup.id, userC.id)).rejects.toThrow(
        "No invite found to reject."
      );
    });

    it("should reject group invite", async () => {
      expect.hasAssertions();

      const admin = await userModel.createUserRecord("admin", "12345");
      const userA = await userModel.createUserRecord("userA", "12345");

      const createdGroup = await groupModel.createGroup("createdGroup", admin.id);

      await groupModel.sendGroupInviteToUsers(createdGroup.id, admin.id, [userA.id]);

      const userANotifications = await notificationModel.getUserNotifications(userA.id);

      expect(userANotifications).toHaveLength(1);

      await groupModel.rejectGroupInvite(createdGroup.id, userA.id);

      const updatedUserANotifications = await notificationModel.getUserNotifications(userA.id);

      expect(updatedUserANotifications).toHaveLength(0);
    });
  });

  describe(groupModel.getGroupWithMembers, () => {
    it("should return group members sorted by username and group admin", async () => {
      expect.hasAssertions();

      const admin = await userModel.createUserRecord("admin", "12345");
      const userA = await userModel.createUserRecord("userA", "12345");
      const userB = await userModel.createUserRecord("userB", "12345");
      const userC = await userModel.createUserRecord("userC", "12345");

      const createdGroup = await groupModel.createGroup("createdGroup", admin.id);

      await groupModel.sendGroupInviteToUsers(createdGroup.id, admin.id, [userB.id, userA.id, userC.id]);

      await groupModel.acceptGroupInvite(createdGroup.id, userA.id);
      await groupModel.acceptGroupInvite(createdGroup.id, userB.id);
      await groupModel.acceptGroupInvite(createdGroup.id, userC.id);

      const updatedGroup = await groupModel.getGroupWithMembers(createdGroup.id);

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

      expect(updatedGroup.admin).toStrictEqual({
        id: admin.id,
        username: "admin",
        imageUrl: null,
      });
    });
  });

  describe(groupModel.updateGroupName, () => {
    it("should throw an error when a non-admin tries to update name", async () => {
      expect.hasAssertions();

      const admin = await userModel.createUserRecord("admin", "12345");
      const member = await userModel.createUserRecord("member", "12345");
      const createdGroup = await groupModel.createGroup("createdGroup", admin.id);

      await expect(groupModel.updateGroupName(createdGroup.id, member.id, "new name")).rejects.toThrow(
        "You do not have permission to update this group name."
      );
    });

    it("should update group name and return updated record", async () => {
      expect.hasAssertions();

      const admin = await userModel.createUserRecord("admin", "12345");
      const createdGroup = await groupModel.createGroup("createdGroup", admin.id);

      const updatedGroup = await groupModel.updateGroupName(createdGroup.id, admin.id, "new name");

      expect(updatedGroup.name).toBe("new name");
    });
  });

  describe(groupModel.removeGroupMember, () => {
    it("should throw an error if a non-admin user tries to remove a member", async () => {
      expect.hasAssertions();

      const admin = await userModel.createUserRecord("admin", "12345");
      const userA = await userModel.createUserRecord("userA", "12345");
      const userB = await userModel.createUserRecord("userB", "12345");
      const userC = await userModel.createUserRecord("userC", "12345");

      const createdGroup = await groupModel.createGroup("createdGroup", admin.id);

      await groupModel.sendGroupInviteToUsers(createdGroup.id, admin.id, [userB.id, userA.id, userC.id]);

      await groupModel.acceptGroupInvite(createdGroup.id, userA.id);
      await groupModel.acceptGroupInvite(createdGroup.id, userB.id);
      await groupModel.acceptGroupInvite(createdGroup.id, userC.id);

      await expect(groupModel.removeGroupMember(createdGroup.id, userB.id, userA.id)).rejects.toThrow(
        "You do not have permission to remove this member."
      );
    });

    it("should remove expected member from group when current user is a member", async () => {
      expect.hasAssertions();

      const admin = await userModel.createUserRecord("admin", "12345");
      const userA = await userModel.createUserRecord("userA", "12345");
      const userB = await userModel.createUserRecord("userB", "12345");
      const userC = await userModel.createUserRecord("userC", "12345");

      const createdGroup = await groupModel.createGroup("createdGroup", admin.id);

      await groupModel.sendGroupInviteToUsers(createdGroup.id, admin.id, [userB.id, userA.id, userC.id]);

      await groupModel.acceptGroupInvite(createdGroup.id, userA.id);
      await groupModel.acceptGroupInvite(createdGroup.id, userB.id);
      await groupModel.acceptGroupInvite(createdGroup.id, userC.id);

      await groupModel.removeGroupMember(createdGroup.id, userB.id, userB.id);

      const updatedGroup = await groupModel.getGroupWithMembers(createdGroup.id);

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

      await groupModel.sendGroupInviteToUsers(createdGroup.id, admin.id, [userB.id, userA.id, userC.id]);

      await groupModel.acceptGroupInvite(createdGroup.id, userA.id);
      await groupModel.acceptGroupInvite(createdGroup.id, userB.id);
      await groupModel.acceptGroupInvite(createdGroup.id, userC.id);

      await groupModel.removeGroupMember(createdGroup.id, userB.id, admin.id);

      const updatedGroup = await groupModel.getGroupWithMembers(createdGroup.id);

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

      await expect(groupModel.getGroupWithMembers(createdGroup.id)).resolves.toBeNull();
    });
  });

  describe(groupModel.getUserGroups, () => {
    it("should return all groups associated with user", async () => {
      expect.hasAssertions();

      const admin = await userModel.createUserRecord("admin", "12345");
      const userA = await userModel.createUserRecord("userA", "12345");
      const userB = await userModel.createUserRecord("userB", "12345");
      const userC = await userModel.createUserRecord("userC", "12345");

      const userCGroup = await groupModel.createGroup("userC'sGroup", userC.id);

      const adminGroup = await groupModel.createGroup("admin'sGroup", admin.id);

      await groupModel.sendGroupInviteToUsers(adminGroup.id, admin.id, [userB.id, userA.id, userC.id]);

      await groupModel.acceptGroupInvite(adminGroup.id, userA.id);
      await groupModel.acceptGroupInvite(adminGroup.id, userB.id);
      await groupModel.acceptGroupInvite(adminGroup.id, userC.id);

      const adminGroups = await groupModel.getUserGroups(admin.id);
      const userAGroups = await groupModel.getUserGroups(userB.id);
      const userBGroups = await groupModel.getUserGroups(userB.id);
      const userCGroups = await groupModel.getUserGroups(userC.id);

      expect(adminGroups).toStrictEqual([
        {
          adminId: admin.id,
          createdAt: expect.any(Date) as Date,
          id: adminGroup.id,
          name: "admin'sGroup",
        },
      ]);

      expect(userAGroups).toStrictEqual([
        {
          adminId: admin.id,
          createdAt: expect.any(Date) as Date,
          id: adminGroup.id,
          name: "admin'sGroup",
        },
      ]);

      expect(userBGroups).toStrictEqual([
        {
          adminId: admin.id,
          createdAt: expect.any(Date) as Date,
          id: adminGroup.id,
          name: "admin'sGroup",
        },
      ]);

      expect(userCGroups).toStrictEqual([
        {
          adminId: userC.id,
          createdAt: expect.any(Date) as Date,
          id: userCGroup.id,
          name: "userC'sGroup",
        },
        {
          adminId: admin.id,
          createdAt: expect.any(Date) as Date,
          id: adminGroup.id,
          name: "admin'sGroup",
        },
      ]);
    });
  });
});
