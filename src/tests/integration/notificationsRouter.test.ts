import { describe, it, expect, beforeEach } from "vitest";
import express from "express";
import request from "supertest";
import type { User } from "../../generated/prisma/index.js";
import notificationsRouter from "../../routes/notificationsRouter.js";
import * as userModel from "../../models/userModel.js";
import * as friendshipModel from "../../models/friendshipModel.js";
import * as groupModel from "../../models/groupModel.js";
import issueJwt from "../../lib/issueJwt.js";
import "../../config/passportConfig.js";
import type { UserNotifications } from "../../types/userNotifications.js";

const app = express();

app.use(express.json());

app.use("/notifications", notificationsRouter);

describe("notificationsRouter routes", () => {
  describe("get logged in user's notifications GET /notifications/me", () => {
    describe("given sent friend requests to userA", () => {
      let userA: Omit<User, "password">;
      let userB: Omit<User, "password">;
      let userC: Omit<User, "password">;

      beforeEach(async () => {
        userA = await userModel.createUserRecord("userA", "12345");
        userB = await userModel.createUserRecord("userB", "12345");
        userC = await userModel.createUserRecord("userC", "12345");

        await friendshipModel.sendFriendRequest(userB.id, userA.id);
        await friendshipModel.sendFriendRequest(userC.id, userA.id);
      });

      it("should return 200 status with userA's notifications", async () => {
        expect.hasAssertions();

        const userAToken = issueJwt(userA.id, "10m");

        const response = await request(app)
          .get("/notifications/me")
          .auth(userAToken, { type: "bearer" })
          .expect("Content-type", /json/)
          .expect(200);

        const typedResponseBody = response.body as { notifications: UserNotifications };

        expect(typedResponseBody.notifications).toStrictEqual<UserNotifications>([
          {
            id: expect.any(String) as string,
            createdAt: expect.any(String) as Date,
            type: "FRIEND_REQUEST",
            groupChatInvitation: null,
            friendRequest: {
              id: expect.any(String) as string,
              receiverId: userA.id,
              status: "PENDING",
              createdAt: expect.any(String) as Date,
              sender: {
                id: userB.id,
                username: "userB",
                imageUrl: null,
              },
            },
          },
          {
            id: expect.any(String) as string,
            createdAt: expect.any(String) as Date,
            type: "FRIEND_REQUEST",
            groupChatInvitation: null,
            friendRequest: {
              id: expect.any(String) as string,
              receiverId: userA.id,
              status: "PENDING",
              createdAt: expect.any(String) as Date,
              sender: {
                id: userC.id,
                username: "userC",
                imageUrl: null,
              },
            },
          },
        ]);
      });

      it("should return 200 status with userB's empty notifications", async () => {
        expect.hasAssertions();

        const userBToken = issueJwt(userB.id, "10m");

        const response = await request(app)
          .get("/notifications/me")
          .auth(userBToken, { type: "bearer" })
          .expect("Content-type", /json/)
          .expect(200);

        const typedResponseBody = response.body as { notifications: never[] };

        expect(typedResponseBody.notifications).toHaveLength(0);
      });

      it("should return 200 status with userC's empty notifications", async () => {
        expect.hasAssertions();

        const userCToken = issueJwt(userC.id, "10m");

        const response = await request(app)
          .get("/notifications/me")
          .auth(userCToken, { type: "bearer" })
          .expect("Content-type", /json/)
          .expect(200);

        const typedResponseBody = response.body as { notifications: never[] };

        expect(typedResponseBody.notifications).toHaveLength(0);
      });
    });

    describe("given sent group invitations to userA", () => {
      let userA: Omit<User, "password">;
      let userB: Omit<User, "password">;
      let userC: Omit<User, "password">;

      beforeEach(async () => {
        userA = await userModel.createUserRecord("userA", "12345");
        userB = await userModel.createUserRecord("userB", "12345");
        userC = await userModel.createUserRecord("userC", "12345");

        const userBGroup = await groupModel.createGroup("userB group", userB.id);
        const userCGroup = await groupModel.createGroup("userC group", userC.id);

        await groupModel.sendGroupInviteToUsers(userBGroup.id, userB.id, [userA.id]);
        await groupModel.sendGroupInviteToUsers(userCGroup.id, userC.id, [userA.id]);
      });

      it("should return 200 status with userA's notifications", async () => {
        expect.hasAssertions();

        const userAToken = issueJwt(userA.id, "10m");

        const response = await request(app)
          .get("/notifications/me")
          .auth(userAToken, { type: "bearer" })
          .expect("Content-type", /json/)
          .expect(200);

        const typedResponseBody = response.body as { notifications: UserNotifications };

        expect(typedResponseBody.notifications).toStrictEqual<UserNotifications>([
          {
            createdAt: expect.any(String) as Date,
            id: expect.any(String) as string,
            type: "GROUP_INVITATION",
            friendRequest: null,
            groupChatInvitation: {
              createdAt: expect.any(String) as Date,
              id: expect.any(String) as string,
              name: "userB group",
              admin: {
                id: userB.id,
                imageUrl: null,
                username: "userB",
              },
            },
          },
          {
            createdAt: expect.any(String) as Date,
            id: expect.any(String) as string,
            type: "GROUP_INVITATION",
            friendRequest: null,
            groupChatInvitation: {
              createdAt: expect.any(String) as Date,
              id: expect.any(String) as string,
              name: "userC group",
              admin: {
                id: userC.id,
                imageUrl: null,
                username: "userC",
              },
            },
          },
        ]);
      });

      it("should return 200 status with userB's empty notifications", async () => {
        expect.hasAssertions();

        const userBToken = issueJwt(userB.id, "10m");

        const response = await request(app)
          .get("/notifications/me")
          .auth(userBToken, { type: "bearer" })
          .expect("Content-type", /json/)
          .expect(200);

        const typedResponseBody = response.body as { notifications: UserNotifications };

        expect(typedResponseBody.notifications).toHaveLength(0);
      });

      it("should return 200 status with userC's empty notifications", async () => {
        expect.hasAssertions();

        const userCToken = issueJwt(userC.id, "10m");

        const response = await request(app)
          .get("/notifications/me")
          .auth(userCToken, { type: "bearer" })
          .expect("Content-type", /json/)
          .expect(200);

        const typedResponseBody = response.body as { notifications: UserNotifications };

        expect(typedResponseBody.notifications).toHaveLength(0);
      });
    });

    describe("given sent friend requests and group invites to userA", () => {
      let userA: Omit<User, "password">;
      let userB: Omit<User, "password">;
      let userC: Omit<User, "password">;

      beforeEach(async () => {
        userA = await userModel.createUserRecord("userA", "12345");
        userB = await userModel.createUserRecord("userB", "12345");
        userC = await userModel.createUserRecord("userC", "12345");

        const userBGroup = await groupModel.createGroup("userB group", userB.id);
        const userCGroup = await groupModel.createGroup("userC group", userC.id);

        await groupModel.sendGroupInviteToUsers(userBGroup.id, userB.id, [userA.id]);
        await groupModel.sendGroupInviteToUsers(userCGroup.id, userC.id, [userA.id]);

        await friendshipModel.sendFriendRequest(userB.id, userA.id);
        await friendshipModel.sendFriendRequest(userC.id, userA.id);
      });

      it("should return 200 status with userA's notifications", async () => {
        expect.hasAssertions();

        const userAToken = issueJwt(userA.id, "10m");

        const response = await request(app)
          .get("/notifications/me")
          .auth(userAToken, { type: "bearer" })
          .expect("Content-type", /json/)
          .expect(200);

        const typedResponseBody = response.body as { notifications: UserNotifications };

        expect(typedResponseBody.notifications).toHaveLength(4);
      });
    });
  });
});
